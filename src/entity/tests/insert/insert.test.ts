import { LegatoConnection } from '../../../connection'
import { ObjectID, ObjectId } from 'mongodb'
import {
	InsertTestWithoutDecorator,
	InsertTest,
} from './entities/Insert.entity'
import { getConnection, setConnection } from '../../..'
import { LegatoErrorObjectAlreadyInserted } from '../../../errors'
import { InsertParentTest } from './entities/InsertParent.entity'
import { InsertChildTest } from './entities/InsertChild.entity'
import { LegatoErrorInsertParent } from '../../../errors/insert/InsertParent.error'

const databaseName = 'insertTest'

describe('insert method', () => {
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
			await InsertTestWithoutDecorator.create<InsertTestWithoutDecorator>({
				name: 'Legato',
			})
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				'Cannot find InsertTestWithoutDecorator collection.'
			)
		}

		expect(hasError).toEqual(true)
	})

	it('should insert with no relations', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert = InsertTest.create<InsertTest>({ name: 'Legato' })
		expect(toInsert._id).toBeUndefined()

		const id = await toInsert.insert()

		expect(id).toBeInstanceOf(ObjectID)
		expect(id).toStrictEqual(toInsert._id)

		// Search element in database
		const fromMongo = await connection.collections.InsertTest.findOne<InsertTest>(
			{
				_id: id,
			}
		)
		expect(fromMongo?._id).toStrictEqual(id)
		expect(fromMongo?.name).toStrictEqual('Legato')
	})

	it('should not insert the same object 2 times', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert = InsertTest.create<InsertTest>({ name: 'Legato' })

		await toInsert.insert()

		let hasError = false
		try {
			await toInsert.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorObjectAlreadyInserted)
		}
		expect(hasError).toEqual(true)

		const count = await connection.collections.InsertTest.countDocuments()
		expect(count).toEqual(1)
	})

	it('should trigger beforeInsert', async (done) => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert = InsertTest.create<InsertTest>({ name: 'Legato' })

		toInsert.beforeInsert<InsertTest>().subscribe((willBeInserted) => {
			expect(willBeInserted).toEqual(toInsert)
			done()
		})

		await toInsert.insert()
	})

	it('should trigger afterInsert', async (done) => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert = InsertTest.create<InsertTest>({ name: 'Legato' })

		toInsert.afterInsert<InsertTest>().subscribe((inserted) => {
			expect(inserted._id).toBeInstanceOf(ObjectID)
			done()
		})

		await toInsert.insert()
	})

	it('should insert with valid one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = InsertParentTest.create<InsertParentTest>({})

		const child = InsertChildTest.create<InsertChildTest>({})
		await connection.collections.InsertChildTest.insertOne(child)

		parent.childId = child._id as ObjectId
		await parent.insert()

		// Search parent
		const parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ _id: parent._id }
		)
		expect(parentFromMongo).toBeTruthy()
		expect(parent.childId).toStrictEqual(child._id)
	})

	it('should insert with valid one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = InsertParentTest.create<InsertParentTest>({})

		const child1 = InsertChildTest.create<InsertChildTest>({})
		const child2 = InsertChildTest.create<InsertChildTest>({})

		await connection.collections.InsertChildTest.insertMany([child1, child2])

		parent.childIds = [child1._id as ObjectID, child2._id as ObjectID]

		await parent.insert()

		// Search parent
		const parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ _id: parent._id }
		)
		expect(parentFromMongo).toBeTruthy()
		expect(parent.childIds.length).toEqual(2)
	})

	it('should insert with  valid one to one relation with custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = InsertParentTest.create<InsertParentTest>({
			childIdString: 'john',
		})
		const child = InsertChildTest.create<InsertChildTest>({ stringId: 'john' })

		await connection.collections.InsertChildTest.insertOne(child)

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		let parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ childIdString: 'john' }
		)

		expect(parentFromMongo._id).toStrictEqual(parent._id)

		// Id as number
		await connection.collections.InsertChildTest.deleteMany({})
		await connection.collections.InsertParentTest.deleteMany({})

		const child1 = InsertChildTest.create<InsertChildTest>({
			numberId: 1,
		})
		const parent1 = InsertParentTest.create<InsertParentTest>({
			childIdNumber: 1,
		})
		await connection.collections.InsertChildTest.insertOne(child1)

		hasError = false

		try {
			await parent1.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		parentFromMongo = await connection.collections.InsertParentTest.findOne({
			childIdNumber: 1,
		})

		expect(parentFromMongo._id).toStrictEqual(parent1._id)
	})

	it('should insert with  valid one to many relation with custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// id string
		const parent = InsertParentTest.create<InsertParentTest>({
			childIdsString: ['john', 'joe'],
		})

		const child3 = InsertChildTest.create<InsertChildTest>({
			stringId: 'john',
		})
		const child4 = InsertChildTest.create<InsertChildTest>({
			stringId: 'joe',
		})
		await connection.collections.InsertChildTest.insertMany([child3, child4])

		let hasError = false

		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		let parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ childIdsString: ['john', 'joe'] }
		)

		expect(parentFromMongo._id).toStrictEqual(parent._id)

		// id number
		await connection.collections.InsertParentTest.deleteMany({})
		await connection.collections.InsertChildTest.deleteMany({})

		const parent1 = InsertParentTest.create<InsertParentTest>({
			name: 'Legato',
		})
		parent1.childIdsNumber = [1, 2]

		const child1 = InsertChildTest.create<InsertChildTest>({
			numberId: 1,
		})
		const child2 = InsertChildTest.create<InsertChildTest>({
			numberId: 2,
		})

		await connection.collections.InsertChildTest.insertMany([child1, child2])

		hasError = false

		try {
			await parent1.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		parentFromMongo = await connection.collections.InsertParentTest.findOne({
			childIdsNumber: [1, 2],
		})
		expect(parentFromMongo._id).toStrictEqual(parent1._id)
	})

	it('should insert with invalid one to one relation and check = false', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const id = new ObjectID()
		const parent = InsertParentTest.create<InsertParentTest>({
			childIdNoCheck: id,
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		// Search parent
		const parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ _id: parent._id }
		)
		expect(parentFromMongo).toBeTruthy()
		expect(parent.childIdNoCheck).toStrictEqual(id)
	})

	it('should insert with invalid one to many relation and check = false', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const ids = [new ObjectID(), new ObjectID()]
		const parent = InsertParentTest.create<InsertParentTest>({
			childIdsNoCheck: ids,
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		// Search parent
		const parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ _id: parent._id }
		)
		expect(parentFromMongo).toBeTruthy()
		expect(parent.childIdsNoCheck).toStrictEqual(ids)
	})

	it('should refuse to insert if one to one relation is not valid', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = InsertParentTest.create<InsertParentTest>({
			childId: new ObjectID(),
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}

		expect(hasError).toBeTruthy()

		// Check that parent not insered
		const counter = await connection.collections.InsertParentTest.countDocuments()
		expect(counter).toEqual(0)
	})

	it('should refuse to insert if one to one relation is not valid with custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// id string
		const parent = InsertParentTest.create<InsertParentTest>({
			childIdString: 'john',
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}

		expect(hasError).toBeTruthy()

		// Check that parent not insered
		let counter = await connection.collections.InsertParentTest.countDocuments()

		expect(counter).toEqual(0)

		// id number
		const parent1 = InsertParentTest.create<InsertParentTest>({
			childIdNumber: 1,
		})

		hasError = false
		try {
			await parent1.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}

		expect(hasError).toBeTruthy()

		// Check that parent not insered
		counter = await connection.collections.InsertParentTest.countDocuments()

		expect(counter).toEqual(0)
	})

	it('should refuse to insert if one to many relation is not valid', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = InsertParentTest.create<InsertParentTest>({
			childIds: [new ObjectID()],
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}

		expect(hasError).toBeTruthy()

		// Check that parent not insered
		let counter = await connection.collections.InsertParentTest.countDocuments()

		expect(counter).toEqual(0)

		// Add a real child but let invalid relation
		const child = InsertChildTest.create<InsertChildTest>({})
		await connection.collections.InsertChildTest.insertOne(child)
		parent.childIds.push(child._id as ObjectID)

		hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}
		expect(hasError).toBeTruthy()

		counter = await connection.collections.InsertParentTest.countDocuments()
		expect(counter).toEqual(0)

		// Delete first invalid relation
		parent.childIds.splice(0, 1)
		expect(parent.childIds[0]).toStrictEqual(child._id)

		hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		const parentsFromMongo = await connection.collections.InsertParentTest.find().toArray()
		expect(parentsFromMongo.length).toEqual(1)

		const parentFromMongo = parentsFromMongo[0] as any
		expect(parentFromMongo.childIds).toStrictEqual([child._id])
	})

	it('should refuse to insert if one to many relation is not valid with custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// id string
		const parent = InsertParentTest.create<InsertParentTest>({
			childIdsString: ['john'],
		})

		let hasError = false
		try {
			await parent.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}
		expect(hasError).toBeTruthy()

		// Check that parent not insered
		let counter = await connection.collections.InsertParentTest.countDocuments()
		expect(counter).toEqual(0)

		// id number
		await connection.collections.InsertChildTest.deleteMany({})

		const parent2 = InsertParentTest.create<InsertParentTest>({
			childIdsNumber: [1],
		})

		hasError = false
		try {
			await parent2.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorInsertParent)
		}
		expect(hasError).toBeTruthy()

		counter = await connection.collections.InsertParentTest.countDocuments()
		expect(counter).toEqual(0)
	})

	it('should insert with default values', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const objWithDefaultValues = InsertTest.create<InsertTest>({})

		expect(objWithDefaultValues.name).not.toBeUndefined()
		const value = objWithDefaultValues.name

		const insertedId = await objWithDefaultValues.insert()

		const mongoValues = await connection.collections.InsertTest.findOne<InsertTest>(
			{
				_id: insertedId,
			}
		)

		expect(mongoValues?.name).toStrictEqual(value)
	})

	it('should insert with set values', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Default
		const defaultValues = InsertTest.create<InsertTest>({})
		expect(defaultValues.name).not.toEqual('John')

		const obj = InsertTest.create<InsertTest>({
			name: 'John',
		})

		const id = await obj.insert()

		const mongoValue = await connection.collections.InsertTest.findOne<InsertTest>(
			{ _id: id }
		)

		expect(mongoValue?.name).toStrictEqual('John')
	})
})
