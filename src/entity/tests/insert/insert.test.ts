import { LegatoEntity } from '../..'
import { LegatoConnection } from '../../../connection'
import { LegatoField } from '../../../decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../../../decorators/relation.decorator'
import { LegatoErrorObjectAlreadyInserted } from '../../../errors'

const databaseName = 'insertTest'

describe('insert method', () => {
	it('should throw an error if collection does not exist', async () => {
		class RandomClassWithoutDecoratorInsert extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		try {
			await new RandomClassWithoutDecoratorInsert().insert()
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratorinsert does not exist.`
			)
			expect(error.code).toEqual('Legato_ERROR_404')
		}

		expect(hasError).toEqual(true)
	})

	it('should insert', async () => {
		class UserInsert extends LegatoEntity {
			@LegatoField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Check if collection if empty
		const count = await connection.collections.userinsert.countDocuments()
		expect(count).toEqual(0)

		const user = new UserInsert('damien@dev.fr')
		const userId = await user.insert()

		// One user created
		expect(userId).toStrictEqual(user._id as {})

		// Check with id
		const userRetrived = await connection.collections.userinsert.findOne({
			_id: userId,
		})
		expect(userRetrived.email).toEqual(user.email)
	})

	it('should not insert fields without decorator', async () => {
		class UserInsertNoDecoratorFieldSaved extends LegatoEntity {
			@LegatoField()
			email: string

			personal: string

			constructor(email: string) {
				super()
				this.email = email
				this.personal = 'love cat'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new UserInsertNoDecoratorFieldSaved('damien@dev.fr')

		const id = await obj.insert()

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
		class UserSaved2Times extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserSaved2Times()
		const id = await user.insert()

		expect(id).toStrictEqual((user as any)._id)

		let hasError = false
		try {
			await user.insert()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorObjectAlreadyInserted)
		}
		expect(hasError).toEqual(true)

		const count = await connection.collections.usersaved2times.countDocuments()
		expect(count).toEqual(1)
	})

	it('should trigger beforeInsert', async (done) => {
		class UserBeforeInsert extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserBeforeInsert()

		user.beforeInsert<UserBeforeInsert>().subscribe((userToInsert) => {
			expect(userToInsert.firstname).toEqual('Damien')
			expect(userToInsert._id).not.toBeDefined()
			done()
		})

		await user.insert()
	})

	it('should trigger afterInsert', async (done) => {
		class UserAfterInsert extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserAfterInsert()

		user.afterInsert<UserAfterInsert>().subscribe((userSaved) => {
			expect(userSaved.firstname).toEqual('Damien')
			expect(userSaved._id).toBeDefined()
			done()
		})

		await user.insert()
	})

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
	})
})
