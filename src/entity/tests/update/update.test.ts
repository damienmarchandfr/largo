import { LegatoConnection } from '../../../connection'
import { ObjectID } from 'mongodb'
import { getConnection, setConnection } from '../../..'
import {
	UpdateTest,
} from './entities/Update.entity'
import { UpdateChildTest } from './entities/UpdateChild.entity'
import { UpdateParentTest } from './entities/UpdateParent.entity'
import { LegatoErrorUpdateParent } from '../../../errors/update/UpdateParent.error'

const databaseName = 'updateTest'

describe('update method', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should update', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = UpdateTest.create<UpdateTest>({})

		// Insert a user with mongo native
		await connection.collections.UpdateTest.insertOne(obj)

		obj.name = 'john doe'
		await obj.update()

		const updated = await connection.collections.UpdateTest.findOne({
			_id: obj._id,
		})

		expect(updated.name).toEqual('john doe')
	})

	it('should not update prop without decorator', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = UpdateTest.create<UpdateTest>({})
		delete obj.noDecorator
		await connection.collections.UpdateTest.insertOne(obj)

		// Update
		obj.noDecorator = 'john doe'
		await obj.update()

		// Get obj in db
		const fromDB = await connection.collections.UpdateTest.findOne({
			_id: obj._id,
		})

		expect(fromDB.noDecorator).toBeUndefined()
	})

	it('should trigger beforeUpdate', async (done) => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = UpdateTest.create<UpdateTest>({})

		await connection.collections.UpdateTest.insertOne(obj)

		obj.beforeUpdate<UpdateTest>().subscribe((update) => {
			const source = update.oldValue
			const partial = update.toUpdate

			expect(source._id).toBeDefined()
			expect(source.name).toEqual('john')

			expect(partial._id).not.toBeDefined()
			expect(partial.name).toEqual('john doe')

			done()
		})

		obj.name = 'john doe'
		await obj.update()
	})

	it('should trigger afterUpdate', async (done) => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = UpdateTest.create<UpdateTest>({})
		await connection.collections.UpdateTest.insertOne(obj)

		obj.afterUpdate<UpdateTest>().subscribe((updateResult) => {
			const before = updateResult.oldValue
			const after = updateResult.newValue

			expect(before._id).toBeDefined()
			expect(before._id).toStrictEqual(after._id)

			expect(before.name).toEqual('john')
			expect(after.name).toEqual('john doe')

			done()
		})

		obj.name = 'john doe'
		await obj.update()
	})

	// ------------ RELATIONS ----------

	it('should not check if check relation is set to false in one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = UpdateParentTest.create<UpdateParentTest>({})

		await connection.collections.UpdateParentTest.insertOne(obj)

		// Set broken relation
		const brokenId = new ObjectID()
		obj.childIdNoCheck = brokenId

		let hasError = false
		try {
			await obj.update()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		// Check relation is set in database
		const objFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: obj._id,
		})

		expect(objFromDb.childIdNoCheck).toStrictEqual(brokenId)
	})

	it('should not check if check relation is set to false in one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const brokenIds = [new ObjectID(), new ObjectID()]
		const obj = UpdateParentTest.create<UpdateParentTest>({})

		await connection.collections.UpdateParentTest.insertOne(obj)

		obj.childIdsNoCheck = brokenIds

		let hasError = false

		try {
			await obj.update()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const objFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: obj._id,
		})

		expect(objFromDb.childIdsNoCheck).toStrictEqual(brokenIds)
	})

	it('should update with valid one to one relation with mongo id', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>({})
		const child = UpdateChildTest.create<UpdateParentTest>({})

		await connection.collections.UpdateChildTest.insertOne(child)

		await connection.collections.UpdateParentTest.insertOne(parent)
		parent.childId = child._id as ObjectID

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			console.log(error)
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})

		expect(parentFromDb.childId).toStrictEqual(child._id)
	})

	it('should not update with not valid one to one relation with mongo id', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		await connection.collections.UpdateParentTest.insertOne(parent)

		let hasError = false
		parent.childId = new ObjectID()
		try {
			await parent.update()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})

		expect(parentFromDb.childId).toBeNull()
	})

	it('should update with valid one to many relation with mongo id', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		// Insert two children
		const child1 = UpdateChildTest.create<UpdateChildTest>()
		const child2 = UpdateChildTest.create<UpdateChildTest>()

		await connection.collections.UpdateChildTest.insertMany([child1, child2])

		// Parent
		const parent = UpdateParentTest.create<UpdateParentTest>()
		expect(parent.childIds).toStrictEqual([])
		await connection.collections.UpdateParentTest.insertOne(parent)

		let hasError = false
		parent.childIds = [child1._id, child2._id] as ObjectID[]

		try {
			await parent.update()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIds).toStrictEqual([child1._id, child2._id])
	})

	it('should not update with not valid one to many relation with mongo id', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		const child = UpdateChildTest.create<UpdateChildTest>()
		const childIdNotinDb = new ObjectID()

		await connection.collections.UpdateChildTest.insertOne(child)
		parent.childIds = [child._id as ObjectID]
		await connection.collections.UpdateParentTest.insertOne(parent)

		parent.childIds.push(childIdNotinDb)

		let hasError = false

		try {
			await parent.update()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})

		expect(parentFromDb.childIds).toStrictEqual([child._id])
	})

	// --------------- STRING ID -----------

	it('should update with valid one to one relation with string', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>({})

		// Child with custom id
		const child = UpdateChildTest.create<UpdateChildTest>()
		child.stringId = '1'

		await connection.collections.UpdateChildTest.insertOne(child)
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdString = '1'

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdString).toEqual('1')
	})

	it('should not update with invalid one to one relation with string', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdString = '1'

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdString).toBeNull()
	})

	it('should update with valid one to many relation with string', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()

		// Children with custom id
		const child1 = UpdateChildTest.create<UpdateChildTest>()
		child1.stringId = '1'

		const child2 = UpdateChildTest.create<UpdateChildTest>()
		child2.stringId = '2'

		await connection.collections.UpdateChildTest.insertMany([child1, child2])
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdsString = ['1', '2']

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdsString).toEqual(['1', '2'])
	})

	it('should not update with invalid one to many relation with number', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		parent.childIdsString = ['1']
		const child1 = UpdateChildTest.create<UpdateChildTest>()
		child1.stringId = '1'

		await connection.collections.UpdateChildTest.insertOne(child1)
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdsString = ['1', '2']

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdsString).toEqual(['1'])
	})

	// --------------- NUMBER ID -----------

	it('should update with valid one to one relation with number', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()

		// Child with custom id
		const child = UpdateChildTest.create<UpdateChildTest>()
		child.numberId = 1

		await connection.collections.UpdateChildTest.insertOne(child)
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdNumber = 1

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdNumber).toEqual(1)
	})

	it('should not update with invalid one to one relation with number', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdNumber = 1

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdNumber).toBeNull()
	})

	it('should update with valid one to many relation with number', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()

		// Children with custom id
		const child1 = UpdateChildTest.create<UpdateChildTest>()
		child1.numberId = 1

		const child2 = UpdateChildTest.create<UpdateChildTest>()
		child2.numberId = 2

		await connection.collections.UpdateChildTest.insertMany([child1, child2])
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdsNumber = [1, 2]

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdsNumber).toEqual([1, 2])
	})

	it('should not update with invalid one to many relation with number', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		const parent = UpdateParentTest.create<UpdateParentTest>()
		parent.childIdsNumber = [1]
		const child1 = UpdateChildTest.create<UpdateChildTest>()
		child1.numberId = 1

		await connection.collections.UpdateChildTest.insertOne(child1)
		await connection.collections.UpdateParentTest.insertOne(parent)

		// Update relation
		parent.childIdsNumber = [1, 2]

		let hasError = false
		try {
			await parent.update()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorUpdateParent)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		const parentFromDb = await connection.collections.UpdateParentTest.findOne({
			_id: parent._id,
		})
		expect(parentFromDb.childIdsNumber).toEqual([1])
	})
})
