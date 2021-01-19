import { LegatoConnection } from '../../../connection'
import {
	UpdateManyEntityTestNoDecorator,
	UpdateManyEntityTest,
} from './entities/UpdateMany.entity.test'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import { getConnection, setConnection } from '../../..'
import { UpdateManyParentTest } from './entities/UpdateManyParent.entity.test'
import { ObjectID, ObjectId } from 'mongodb'
import { LegatoErrorUpdateManyParent } from '../../../errors/updateMany/UpdateManyParent.error'
import { UpdateManyChildTest } from './entities/UpdateManyChild.entity.test'

const databaseName = 'updatemanyTest'

describe(`static method updateMany`, () => {
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

		try {
			await UpdateManyEntityTestNoDecorator.updateMany<
				UpdateManyEntityTestNoDecorator
			>({ name: 'john' }, { name: 'damien' })
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('should update one element with query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj1 = new UpdateManyEntityTest('john doe 1')
		const obj2 = new UpdateManyEntityTest('john doe 2')
		await connection.collections.UpdateManyEntityTest.insertMany([obj1, obj2])

		// Update
		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'john doe 1' },
			{ name: 'john doe 1.5' }
		)

		// Search old value
		let counter = await connection.collections.UpdateManyEntityTest.countDocuments(
			{ name: 'john doe 1' }
		)
		expect(counter).toEqual(0)

		// Get updated
		counter = await connection.collections.UpdateManyEntityTest.countDocuments({
			name: 'john doe 1.5',
		})
		expect(counter).toEqual(1)

		// Get not updated
		counter = await connection.collections.UpdateManyEntityTest.countDocuments({
			name: 'john doe 2',
		})
		expect(counter).toEqual(1)
	})

	it('should update many element with query filter', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		// Create 3 elements
		const obj1 = new UpdateManyEntityTest('john')
		const obj2 = new UpdateManyEntityTest('john')
		const obj3 = new UpdateManyEntityTest('doe')

		await connection.collections.UpdateManyEntityTest.insertMany([
			obj1,
			obj2,
			obj3,
		])

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'john' },
			{ name: 'john updated' }
		)

		let updated = await connection.collections.UpdateManyEntityTest.findOne({
			_id: obj1._id,
		})
		expect(updated.name).toEqual('john updated')

		updated = await connection.collections.UpdateManyEntityTest.findOne({
			_id: obj2._id,
		})
		expect(updated.name).toEqual('john updated')

		const notUpdated = await connection.collections.UpdateManyEntityTest.findOne(
			{ _id: obj3._id }
		)
		expect(notUpdated.name).toEqual('doe')
	})

	it('should update all elements with empty query filter', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		// Create 3 elements
		const obj1 = new UpdateManyEntityTest('john')
		const obj2 = new UpdateManyEntityTest('doe')
		const obj3 = new UpdateManyEntityTest('damien')

		await connection.collections.UpdateManyEntityTest.insertMany([
			obj1,
			obj2,
			obj3,
		])

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{},
			{ name: 'john updated' }
		)

		const updatedCounter = await connection.collections.UpdateManyEntityTest.countDocuments(
			{ name: 'john updated' }
		)
		expect(updatedCounter).toEqual(3)
	})

	it('should not update elements', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const obj1 = new UpdateManyEntityTest('john')
		const obj2 = new UpdateManyEntityTest('doe')

		await connection.collections.UpdateManyEntityTest.insertMany([obj1, obj2])

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'damien' },
			{ name: 'john doe' }
		)

		const counter = await connection.collections.UpdateManyEntityTest.countDocuments(
			{ name: 'john doe' }
		)
		expect(counter).toEqual(0)
	})

	it('should not set properties without decorator', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const obj1 = new UpdateManyEntityTest('john')
		delete obj1.noDecorator

		await connection.collections.UpdateManyEntityTest.insertOne(obj1)

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'john' },
			{ noDecorator: 'john doe' }
		)

		const objFromDb = await connection.collections.UpdateManyEntityTest.findOne(
			{ name: 'john' }
		)
		expect(objFromDb.noDecorator).toBeUndefined()
	})

	// ------- RELATIONS MONGO ID ---------

	it('should not check if check relation is set to false in one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj1 = new UpdateManyParentTest('john doe')
		const obj2 = new UpdateManyParentTest('john doe')
		await connection.collections.UpdateManyParentTest.insertMany([obj1, obj2])

		// Set broken relation
		const brokenId = new ObjectID()

		let hasError = false
		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{ name: 'john doe' },
				{ childIdNoCheck: brokenId }
			)
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		// Check relation is set in database
		const objFromDb = await connection.collections.UpdateManyParentTest.findOne(
			{
				childIdNoCheck: brokenId,
			}
		)

		expect(objFromDb.childIdNoCheck).toStrictEqual(brokenId)
	})

	it('should not check if check relation is set to false in one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent1 = new UpdateManyParentTest('john')
		const parent2 = new UpdateManyParentTest('doe')

		// Save parents with no relations
		await connection.collections.UpdateManyParentTest.insertMany([
			parent1,
			parent2,
		])
		const brokenId = new ObjectID()

		let hasError = false

		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{},
				{ childIdsNoCheck: [brokenId] }
			)
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		const updated = await connection.collections.UpdateManyParentTest.find().toArray()
		expect(updated.length).toEqual(2)

		for (const up of updated) {
			expect(up.childIdsNoCheck).toStrictEqual([brokenId])
		}
	})

	// ----- UPDATE MANY CHECK = false -------

	it('should not check one to one relation if decorator check = true but check = false in parameters', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent1 = new UpdateManyParentTest('john')
		const parent2 = new UpdateManyParentTest('doe')
		await connection.collections.UpdateManyParentTest.insertMany([
			parent1,
			parent2,
		])

		let hasError = false

		const id = new ObjectID()
		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{},
				{ childId: id },
				false
			)
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const updated = await connection.collections.UpdateManyParentTest.find(
			{}
		).toArray()
		expect(updated.length).toEqual(2)

		for (const up of updated) {
			expect(up.childId).toStrictEqual(id)
		}
	})

	it('should not check one to many relation if decorator check = true but check = false in parameters', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent1 = new UpdateManyParentTest('john')
		const parent2 = new UpdateManyParentTest('doe')

		await connection.collections.UpdateManyParentTest.insertMany([
			parent1,
			parent2,
		])

		const ids = [new ObjectID(), new ObjectID()]
		let hasError = false

		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{},
				{ childIds: ids },
				false
			)
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		const updated = await connection.collections.UpdateManyParentTest.find(
			{}
		).toArray()

		for (const up of updated) {
			expect(up.childIds).toStrictEqual(ids)
		}
	})

	// ----- CHECK ONE TO ONE RELATION  ------

	it('should throw error when update parent with broken one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		let hasError = false

		// Create parent
		const parent = new UpdateManyParentTest('john')

		// Save parent
		await connection.collections.UpdateManyParentTest.insert(parent)

		const id = new ObjectID()
		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{ name: 'john' },
				{ childId: id }
			)
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateManyParent)
			hasError = true
		}
		expect(hasError).toBeTruthy()

		// Check no change
		const notUpdated = await connection.collections.UpdateManyParentTest.find().toArray()
		for (const notUp of notUpdated) {
			expect(notUp.childId).toBeNull()
		}
	})

	it('should throw error when update parent with broken one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new UpdateManyParentTest('john')

		const child = new UpdateManyChildTest('bob')
		await connection.collections.UpdateManyChildTest.insertOne(child)
		parent.childIds = [child._id as ObjectId]

		await connection.collections.UpdateManyParentTest.insertOne(parent)

		let hasError = false

		try {
			await UpdateManyParentTest.updateMany<UpdateManyParentTest>(
				{},
				{ childIds: [child._id as ObjectID, new ObjectID()] }
			)
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorUpdateManyParent)
		}

		expect(hasError).toBeTruthy()

		// Check no change
		const notUpdated = await connection.collections.UpdateManyParentTest.find().toArray()

		for (const notUp of notUpdated) {
			expect(notUp.childIds).toStrictEqual([child._id])
		}
	})
})
