import { MongODMEntity } from '../entity'
import { MongODMConnection } from '../../connection/connection'
import { MongODMField } from '../../decorators/field.decorator'
import { MongODMAlreadyInsertedError } from '../../errors/errors'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from '../../decorators/relation.decorator'

const databaseName = 'insertTest'

describe('insert method', () => {
	it('should throw an error if collection does not exist', async () => {
		class RandomClassWithoutDecoratorInsert extends MongODMEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		try {
			await new RandomClassWithoutDecoratorInsert().insert(connection)
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratorinsert does not exist.`
			)
			expect(error.code).toEqual('MONGODM_ERROR_404')
		}

		expect(hasError).toEqual(true)
	})

	it('should insert', async () => {
		class UserInsert extends MongODMEntity {
			@MongODMField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Check if collection if empty
		const count = await connection.collections.userinsert.countDocuments()
		expect(count).toEqual(0)

		const user = new UserInsert('damien@dev.fr')
		const userId = await user.insert(connection)

		// One user created
		expect(userId).toStrictEqual(user._id as {})

		// Check with id
		const userRetrived = await connection.collections.userinsert.findOne({
			_id: userId,
		})
		expect(userRetrived.email).toEqual(user.email)
	})

	it('should not insert fields without decorator', async () => {
		class UserInsertNoDecoratorFieldSaved extends MongODMEntity {
			@MongODMField()
			email: string

			personal: string

			constructor(email: string) {
				super()
				this.email = email
				this.personal = 'love cat'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new UserInsertNoDecoratorFieldSaved('damien@dev.fr')

		const id = await obj.insert(connection)

		const saved = await connection.collections.userinsertnodecoratorfieldsaved.findOne(
			{
				_id: id,
			}
		)

		expect(saved).toStrictEqual({
			_id: id,
			email: 'damien@dev.fr',
		})
	})

	it('should not insert the same object 2 times', async () => {
		class UserSaved2Times extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserSaved2Times()
		const id = await user.insert(connection)

		expect(id).toStrictEqual((user as any)._id)

		let hasError = false
		try {
			await user.insert(connection)
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(MongODMAlreadyInsertedError)
		}
		expect(hasError).toEqual(true)

		const count = await connection.collections.usersaved2times.countDocuments()
		expect(count).toEqual(1)
	})

	it('should trigger beforeInsert', async (done) => {
		class UserBeforeInsert extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserBeforeInsert()

		user.events.beforeInsert.subscribe((userToInsert) => {
			expect(userToInsert.firstname).toEqual('Damien')
			expect(userToInsert._id).not.toBeDefined()
			done()
		})

		await user.insert(connection)
	})

	it('should trigger afterInsert', async (done) => {
		class UserAfterInsert extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserAfterInsert()

		user.events.afterInsert.subscribe((userSaved) => {
			expect(userSaved.firstname).toEqual('Damien')
			expect(userSaved._id).toBeDefined()
			done()
		})

		await user.insert(connection)
	})

	it('should return an error if relation set does not exist', async () => {
		const objectIDset = new ObjectID()
		class JobRelationDecoratorInvalidRelation extends MongODMEntity {
			@MongODMField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'company name'
			}
		}

		class UserRelationDecoratorInvalidRelation extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
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

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert Job
		await new JobRelationDecoratorInvalidRelation().insert(connection)

		// Insert User with jobId not in database
		let hasError = false

		try {
			await new UserRelationDecoratorInvalidRelation().insert(connection)
		} catch (error) {
			const message = `You set jobId : ${objectIDset.toHexString()} on object UserRelationDecoratorInvalidRelation. JobRelationDecoratorInvalidRelation with _id : ${objectIDset.toHexString()} does not exist.`
			expect(error.message).toEqual(message)
			hasError = true
		}

		expect(hasError).toEqual(true)
	})

	it('should throw error if one element does not exist in one to many relation', async () => {
		const objectIDNotUsed = new ObjectID()
		class JobRelationDecoratorInvalidRelations extends MongODMEntity {
			@MongODMField()
			companyName: string

			constructor(index: number) {
				super()
				this.companyName = 'company name ' + index
			}
		}

		class UserRelationDecoratorInvalidRelations extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
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

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create a job
		const job = new JobRelationDecoratorInvalidRelations(0)
		const jobId = await job.insert(connection)

		// Create user linked to the job saved before
		const user = new UserRelationDecoratorInvalidRelations(jobId)
		// Add a job not in db
		user.addNotSavedJob(objectIDNotUsed)

		let hasError = false

		try {
			await user.insert(connection)
		} catch (error) {
			hasError = true
		}

		expect(hasError).toEqual(true)
	})
})
