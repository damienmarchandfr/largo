import { LegatoConnection } from '../../../connection'
import { ObjectID } from 'mongodb'
import { getConnection, setConnection } from '../../..'
import {
	DeleteEntityTestWithoutDecorator,
	DeleteEntityTest,
} from './entities/Delete.entity.test'
import { DeleteChildTest } from './entities/DeleteChild.entity.test'
import { DeleteParentTest } from './entities/DeleteParent.entity.test'
import { LegatoErrorDeleteParent } from '../../../errors/delete/DeleteParent.error'

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
		const toDelete = new DeleteEntityTest('John')
		try {
			await toDelete.delete()
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot delete DeleteEntityTest. No mongoID set.`
			)
		}

		expect(hasError).toBeTruthy()
	})

	it('should delete', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new DeleteEntityTest('john')

		// Insert with native
		const insertResult = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)
		obj._id = insertResult.insertedId

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

		const obj = new DeleteEntityTest('john')
		const inserted = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)

		obj._id = inserted.insertedId

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

		const obj = new DeleteEntityTest('john')

		const inserted = await connection.collections.DeleteEntityTest.insertOne(
			obj
		)
		obj._id = inserted.insertedId

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

		const parent = new DeleteParentTest()
		await parent.insert()

		const child = new DeleteChildTest()
		const childId = await child.insert()

		parent.childId = childId

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true

			expect(error).toBeInstanceOf(LegatoErrorDeleteParent)
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

		const parent = new DeleteParentTest()
		await parent.insert()

		const child = new DeleteChildTest()
		const childId = await child.insert()

		const child2 = new DeleteChildTest()
		const child2Id = await child2.insert()

		parent.childIds = [childId, child2Id]

		await parent.update()

		let hasError = false

		try {
			await child.delete()
		} catch (error) {
			hasError = true

			expect(error).toBeInstanceOf(LegatoErrorDeleteParent)
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

	it('should accept to delete child if check relation is false for one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new DeleteParentTest()
		await parent.insert()

		const child = new DeleteChildTest()
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

		const parent = new DeleteParentTest()
		await parent.insert()

		const child = new DeleteChildTest()
		const childId = await child.insert()

		const child2 = new DeleteChildTest()
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
