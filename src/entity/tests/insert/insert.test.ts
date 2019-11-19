import { LegatoConnection } from '../../../connection'
import { ObjectID } from 'mongodb'
import {
	InsertTestWithoutDecorator,
	InsertTest,
} from './entities/Insert.entity.test'
import { getConnection, setConnection } from '../../..'
import { LegatoErrorObjectAlreadyInserted } from '../../../errors'
import { InsertParentTest } from './entities/InsertParent.entity.test'
import { InserChildTest } from './entities/InsertChild.entity.test'
import { connect } from 'http2'

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

		const child = new InserChildTest()
		await connection.collections.InserChildTest.insertOne(child)

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

		const child1 = new InserChildTest()
		const child2 = new InserChildTest()

		await connection.collections.InserChildTest.insertMany([child1, child2])

		parent.childIds = [child1._id as ObjectID, child2._id as ObjectID]

		await parent.insert()

		// Search parent
		const parentFromMongo = await connection.collections.InsertParentTest.findOne(
			{ _id: parent._id }
		)
		expect(parentFromMongo).toBeTruthy()
		expect(parent.childIds.length).toEqual(2)
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
			console.log(error)
		}

		expect(hasError).toBeTruthy()
	})

	/*
	

	

	it('should return an error if relation set does not exist', async () => {
		const objectIDset = new ObjectID()
		class JobRelationDecoratorInvalidRelation extends LegatoEntity {
			@LegatoField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'company name'
			}
		}

		class UserRelationDecoratorInvalidRelation extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorInvalidRelation,
			})
			jobId: ObjectID | null = null
			job?: JobRelationDecoratorInvalidRelation | null

			constructor() {
				super()
				this.email = 'damien@mail.com'
				this.jobId = objectIDset // No job with this _id
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert Job
		await new JobRelationDecoratorInvalidRelation().insert()

		// Insert User with jobId not in database
		let hasError = false

		try {
			await new UserRelationDecoratorInvalidRelation().insert()
		} catch (error) {
			const message = `You set jobId : ${objectIDset.toHexString()} on object UserRelationDecoratorInvalidRelation. JobRelationDecoratorInvalidRelation with _id : ${objectIDset.toHexString()} does not exist.`
			expect(error.message).toEqual(message)
			hasError = true
		}

		expect(hasError).toEqual(true)
	})

	it('should throw error if one element does not exist in one to many relation', async () => {
		const objectIDNotUsed = new ObjectID()
		class JobRelationDecoratorInvalidRelations extends LegatoEntity {
			@LegatoField()
			companyName: string

			constructor(index: number) {
				super()
				this.companyName = 'company name ' + index
			}
		}

		class UserRelationDecoratorInvalidRelations extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorInvalidRelations,
			})
			jobIds: ObjectID[] = []
			job?: JobRelationDecoratorInvalidRelations[]

			constructor(savedJobId: ObjectID) {
				super()
				this.email = 'damien@mail.com'
				this.jobIds.push(savedJobId)
			}

			addNotSavedJob(id: ObjectID) {
				this.jobIds.push(id)
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create a job
		const job = new JobRelationDecoratorInvalidRelations(0)
		const jobId = await job.insert()

		// Create user linked to the job saved before
		const user = new UserRelationDecoratorInvalidRelations(jobId)
		// Add a job not in db
		user.addNotSavedJob(objectIDNotUsed)

		let hasError = false

		try {
			await user.insert()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toEqual(true)
	}*/
})
