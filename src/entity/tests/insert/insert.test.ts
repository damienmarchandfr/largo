import { LegatoConnection } from '../../../connection'
import { ObjectID } from 'mongodb'
import {
	InsertTestWithoutDecorator,
	InsertTest,
} from './entities/Insert.entity.test'
import { getConnection, setConnection } from '../../..'
import { LegatoErrorObjectAlreadyInserted } from '../../../errors'
import { InsertParentTest } from './entities/InsertParent.entity.test'
import { InsertChildTest } from './entities/InsertChild.entity.test'
import { connect } from 'http2'
import { LegatoErrorInsertParent } from '../../../errors/insert/InsertParent.error'
import { ChildEntityTest } from '../index/enities/Child.entity.test'

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
			await new InsertTestWithoutDecorator().insert()
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

		const toInsert = new InsertTest()
		expect(toInsert._id).toBeUndefined()

		const id = await toInsert.insert()

		expect(id).toBeInstanceOf(ObjectID)
		expect(id).toStrictEqual(toInsert._id)

		// Search element in database
		const fromMongo = await connection.collections.InsertTest.findOne({
			_id: id,
		})
		expect(fromMongo._id).toStrictEqual(id)
	})

	it('should not insert the same object 2 times', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert = new InsertTest()

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

		const toInsert = new InsertTest()

		toInsert.beforeInsert<InsertTest>().subscribe((willBeinserted) => {
			expect(willBeinserted).toEqual(toInsert)
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

		const toInsert = new InsertTest()

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

		const parent = new InsertParentTest()

		const child = new InsertChildTest()
		await connection.collections.InsertChildTest.insertOne(child)

		parent.childId = child._id as ObjectID

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

		const parent = new InsertParentTest()

		const child1 = new InsertChildTest()
		const child2 = new InsertChildTest()

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

		const parent = new InsertParentTest()
		parent.childIdString = 'john'

		const child = new InsertChildTest()
		child.stringId = 'john'

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

		const child1 = new InsertChildTest()
		child1.numberId = 1

		const parent1 = new InsertParentTest()
		parent1.childIdNumber = 1

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
		const parent = new InsertParentTest()
		parent.childIdsString = ['john']

		const child = new InsertChildTest()
		child.stringId = 'john'

		await connection.collections.InsertChildTest.insertOne(child)

		let hasError = false

		try {
			await parent.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		let parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ childIdsString: ['john'] }
		)

		expect(parentFromMongo._id).toStrictEqual(parent._id)

		// id number
		await connection.collections.InsertParentTest.deleteMany({})
		await connection.collections.InsertChildTest.deleteMany({})

		const parent1 = new InsertParentTest()
		parent1.childIdsNumber = [1]

		const child1 = new InsertChildTest()
		child1.numberId = 1

		await connection.collections.InsertChildTest.insertOne(child1)

		hasError = false

		try {
			await parent1.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		parentFromMongo = await connection.collections.InsertParentTest.findOne({
			childIdsNumber: [1],
		})
		expect(parentFromMongo._id).toStrictEqual(parent1._id)
	})

	it('should insert with invalid one to one relation and check = false', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new InsertParentTest()

		const id = new ObjectID()
		parent.childIdNoCheck = id

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

		const parent = new InsertParentTest()

		const ids = [new ObjectID(), new ObjectID()]
		parent.childIdsNoCheck = ids

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

		const parent = new InsertParentTest()
		parent.childId = new ObjectID()

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
		const parent = new InsertParentTest()
		parent.childIdString = 'john'

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
		const parent1 = new InsertParentTest()
		parent1.childIdNumber = 1

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

		const parent = new InsertParentTest()
		parent.childIds = [new ObjectID()]

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
		const child = new InsertChildTest()
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
		const parent = new InsertParentTest()
		parent.childIdsString = ['john']

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

		const parent2 = new InsertParentTest()
		parent2.childIdsNumber = [1]

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

	it('should copy value in object after insert', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new InsertTest('john doe')
		await obj.insert()

		expect(obj.getCopy()).toStrictEqual({
			name: 'john doe',
			_id: obj._id,
		})
	})
})
