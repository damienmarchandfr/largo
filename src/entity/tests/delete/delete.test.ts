import { LegatoConnection } from '../../../connection'
import { ObjectID } from 'mongodb'
import { getConnection, setConnection } from '../../..'
import {
	DeleteEntityTestWithoutDecorator,
	DeleteEntityTest,
} from './entities/Delete.entity'
import { DeleteChildTest } from './entities/DeleteChild.entity'
import { DeleteParentTest } from './entities/DeleteParent.entity'
import { LegatoErrorDeleteChild } from '../../../errors/delete/DeleteChild.error'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import { LegatoErrorDeleteNoMongoID } from '../../../errors/delete/NoMongoIdDelete.error'

const databaseName = 'deleteTest'

describe('delete method', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw an error if collection does not exist', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		const toDelete = new DeleteEntityTestWithoutDecorator()
		const id = new ObjectID()
		toDelete._id = id

		try {
			await toDelete.delete()
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot find DeleteEntityTestWithoutDecorator collection.`
			)
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toBeTruthy()
	})

	it('should throw error if object does not have _id', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		// No _id set
		const toDelete = DeleteEntityTest.create<DeleteEntityTest>({
			name: 'John',
		})
		try {
			await toDelete.delete()
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot delete DeleteEntityTest. No MongoID set.`
			)
			expect(error).toBeInstanceOf(LegatoErrorDeleteNoMongoID)
		}

		expect(hasError).toBeTruthy()
	})

	it('should delete', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = DeleteEntityTest.create<DeleteEntityTest>({ name: 'john' })

		// Insert with native
		const insertResult = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)
		obj._id = insertResult.insertedId as ObjectID

		// Check obj in db
		const check = await connection.collections.DeleteEntityTest.findOne({
			_id: obj._id,
		})
		expect(check.name).toEqual(obj.name)

		// Delete
		await obj.delete()
		const checkDeleted = await connection.collections.DeleteEntityTest.findOne({
			_id: obj._id,
		})
		expect(checkDeleted).toBeNull()
	})

	it('should trigger beforeDelete', async (done) => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = DeleteEntityTest.create<DeleteEntityTest>({ name: 'john' })
		const inserted = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)

		obj._id = inserted.insertedId as ObjectID

		obj.beforeDelete<DeleteEntityTest>().subscribe((objBeforeDelete) => {
			expect(objBeforeDelete._id).toStrictEqual(inserted.insertedId)
			done()
		})

		await obj.delete()
	})

	it('should trigger afterDelete', async (done) => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = DeleteEntityTest.create<DeleteEntityTest>({ name: 'john' })

		const inserted = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)
		obj._id = inserted.insertedId as ObjectID

		obj.afterDelete<DeleteEntityTest>().subscribe(async (objDeleted) => {
			expect(objDeleted._id).toStrictEqual(inserted.insertedId)
			expect(objDeleted.name).toEqual('john')

			// Check if in db
			const check = await connection.collections.DeleteEntityTest.findOne({
				_id: inserted.insertedId,
			})

			expect(check).toEqual(null)

			done()
		})

		await obj.delete()
	})

	it('should be forbidden to delete an object with a one to one child relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = DeleteParentTest.create<DeleteParentTest>()
		await parent.insert()

		const child = DeleteChildTest.create<DeleteChildTest>()
		const childId = await child.insert()

		parent.childId = childId

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true

			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			expect(error.toPlainObj()).toStrictEqual({
				message: `Cannot delete DeleteChildTest with _id = ${child._id} because it's linked to his parent DeleteParentTest with _id = ${parent._id}.`,
				parent: parent.toPlainObj(),
				parentClass: DeleteParentTest,
				parentCollectionName: 'DeleteParentTest',
				parentMongoID: parent._id,
				parentRelationKey: 'childId',
				parentRelationKeyValue: parent.childId,

				child: child.toPlainObj(),
				childClass: DeleteChildTest,
				childCollectionName: 'DeleteChildTest',
				childMongoID: child._id,
				childRelationKey: '_id',
				childRelationKeyValue: child._id,
			})
		}

		expect(hasError).toBeTruthy()

		// Check child not deleted
		const childNotDeleted = await connection.collections.DeleteChildTest.findOne(
			{ _id: child._id }
		)

		expect(childNotDeleted._id).toStrictEqual(childId)
	})

	it('should be forbidden to delete an object with one to many parent relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = DeleteParentTest.create<DeleteParentTest>()
		await parent.insert()

		const child = DeleteChildTest.create<DeleteChildTest>()
		const childId = await child.insert()

		const child2 = DeleteChildTest.create<DeleteChildTest>()
		const child2Id = await child2.insert()

		parent.childIds = [childId, child2Id]

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true

			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			expect(error.toPlainObj()).toStrictEqual({
				message: `Cannot delete DeleteChildTest with _id = ${child._id} because it's linked to his parent DeleteParentTest with _id = ${parent._id}.`,
				parent: parent.toPlainObj(),
				parentClass: DeleteParentTest,
				parentCollectionName: 'DeleteParentTest',
				parentMongoID: parent._id,
				parentRelationKey: 'childIds',
				parentRelationKeyValue: parent.childIds,

				child: child.toPlainObj(),
				childClass: DeleteChildTest,
				childCollectionName: 'DeleteChildTest',
				childMongoID: child._id,
				childRelationKey: '_id',
				childRelationKeyValue: child._id,
			})
		}

		expect(hasError).toBeTruthy()

		// Check children not deleted
		let childNotDeleted = await connection.collections.DeleteChildTest.findOne({
			_id: child._id,
		})
		expect(childNotDeleted._id).toStrictEqual(childId)

		childNotDeleted = await connection.collections.DeleteChildTest.findOne({
			_id: child2._id,
		})
		expect(childNotDeleted._id).toStrictEqual(child2Id)
	})

	it('should be forbidden to delete an object with a one to one child relation with customs id type', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Custom id as string
		const parent = DeleteParentTest.create<DeleteParentTest>({
			childIdString: 'john',
		})

		const child = DeleteChildTest.create<DeleteChildTest>({
			stringId: 'john',
		})

		await connection.collections.DeleteParentTest.insertOne(parent)
		await connection.collections.DeleteChildTest.insertOne(child)

		let hasError = false
		try {
			await child.delete()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			// Custom key
			expect(error.childRelationKey).toEqual('stringId')
			// Custom id value
			expect(error.childRelationKeyValue).toEqual('john')
			hasError = true
		}

		expect(hasError).toBeTruthy()

		let childCounter = await connection.collections.DeleteChildTest.countDocuments()
		expect(childCounter).toEqual(1)

		// Custom id as number
		const parent2 = DeleteParentTest.create<DeleteParentTest>({
			childIdNumber: 1,
		})
		const child2 = DeleteChildTest.create<DeleteChildTest>({
			numberId: 1,
		})

		await connection.collections.DeleteParentTest.insertOne(parent2)
		await connection.collections.DeleteChildTest.insertOne(child2)

		hasError = false
		try {
			await child2.delete()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			// Custom key
			expect(error.childRelationKey).toEqual('numberId')
			// Custom id value
			expect(error.childRelationKeyValue).toEqual(1)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		// search child
		childCounter = await connection.collections.DeleteChildTest.countDocuments({
			numberId: 1,
		})
		expect(childCounter).toEqual(1)
	})

	it('should be forbidden to delete an object with a one to many children relation with customs id type', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Custom id as string
		const parent = DeleteParentTest.create<DeleteParentTest>({
			childIdsString: ['john'],
		})

		const child = DeleteChildTest.create<DeleteChildTest>({
			stringId: 'john',
		})

		await connection.collections.DeleteParentTest.insertOne(parent)
		await connection.collections.DeleteChildTest.insertOne(child)

		let hasError = false
		try {
			await child.delete()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			// Custom key
			expect(error.childRelationKey).toEqual('stringId')
			// Custom id value
			expect(error.childRelationKeyValue).toEqual('john')
			hasError = true
		}

		expect(hasError).toBeTruthy()

		let childCounter = await connection.collections.DeleteChildTest.countDocuments()
		expect(childCounter).toEqual(1)

		// Custom id as number
		const parent2 = DeleteParentTest.create<DeleteParentTest>({
			childIdsNumber: [1],
		})
		const child2 = DeleteChildTest.create<DeleteChildTest>({
			numberId: 1,
		})

		await connection.collections.DeleteParentTest.insertOne(parent2)
		await connection.collections.DeleteChildTest.insertOne(child2)

		hasError = false
		try {
			await child2.delete()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			// Custom key
			expect(error.childRelationKey).toEqual('numberId')
			// Custom id value
			expect(error.childRelationKeyValue).toEqual(1)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		// search child
		childCounter = await connection.collections.DeleteChildTest.countDocuments({
			numberId: 1,
		})
		expect(childCounter).toEqual(1)
	})

	it('should accept to delete child if check relation is false for one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = DeleteParentTest.create<DeleteParentTest>()
		await parent.insert()

		const child = DeleteChildTest.create<DeleteChildTest>()
		const childId = await child.insert()

		parent.childIdNoCheck = childId

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// Must be deleted
		const childDeleted = await connection.collections.DeleteChildTest.findOne({
			_id: child._id,
		})
		expect(childDeleted).toBeNull()
	})

	it('should delete children if check relation is false to one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = DeleteParentTest.create<DeleteParentTest>()
		await parent.insert()

		const child = DeleteChildTest.create<DeleteChildTest>()
		const childId = await child.insert()

		const child2 = DeleteChildTest.create<DeleteChildTest>()
		const child2Id = await child2.insert()

		parent.childIdsNoCheck = [childId, child2Id]

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// Must be deleted
		let childDeleted = await connection.collections.DeleteChildTest.findOne({
			_id: child._id,
		})
		expect(childDeleted).toBeNull()

		try {
			await child2.delete()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// Must be deleted
		childDeleted = await connection.collections.DeleteChildTest.findOne({
			_id: child2._id,
		})
		expect(childDeleted).toBeNull()
	})
})
