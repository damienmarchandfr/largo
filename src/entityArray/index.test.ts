import { LegatoEntity } from '../entity'
import { LegatoIndex } from '../decorators/index.decorator'
import { LegatoField } from '../decorators/field.decorator'
import { LegatoRelation } from '../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { LegatoConnection } from '../connection'

const databaseName = 'entityArrayTest'

describe('LegatoEntityArray class', () => {
	it('should populate many with _id by default', async () => {
		class JobPopulateManyDefaultId extends LegatoEntity {
			@LegatoIndex({
				unique: true,
			})
			name: string

			constructor(jobName: string) {
				super()
				this.name = jobName
			}
		}

		class UserPopulateManyDefaultId extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateManyDefaultId,
			})
			jobId: ObjectID | null
			job?: JobPopulateManyDefaultId

			@LegatoRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateManyDefaultId,
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateManyDefaultId[]

			constructor(jobId: ObjectID) {
				super()
				this.firstname = 'Damien'
				this.jobId = jobId
				this.jobIds = [jobId]
			}

			addJobId(jobId: ObjectID) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert jobs
		const job = new JobPopulateManyDefaultId('Dictator')
		const jobInsertedId = await job.insert(connection)

		const job2 = new JobPopulateManyDefaultId('President')
		const job2InsertedId = await job2.insert(connection)

		// Insert many users
		const usersPromises = []
		for (let i = 0; i < 5; i++) {
			const user = new UserPopulateManyDefaultId(jobInsertedId)
			user.addJobId(job2InsertedId)
			usersPromises.push(user.insert(connection))
		}
		await Promise.all(usersPromises)

		// Get all users
		const users = await UserPopulateManyDefaultId.find(connection, {})
		const populatedUsers = await users.populate(connection)

		expect(populatedUsers.length).toEqual(5)

		for (const populatedUser of populatedUsers) {
			expect(populatedUser.job).toStrictEqual({
				_id: jobInsertedId,
				name: 'Dictator',
			})
			expect((populatedUser.jobs as JobPopulateManyDefaultId[]).length).toEqual(
				2
			)
			expect(
				(populatedUser.jobs as JobPopulateManyDefaultId[])[0]
			).not.toStrictEqual((populatedUser.jobs as JobPopulateManyDefaultId[])[1])
		}
	})

	it('should populate many with other key for relation', async () => {
		class JobPopulateIdCustomRelationKey extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoField()
			customId: ObjectID

			constructor(name: string) {
				super()
				this.name = name
				this.customId = new ObjectID()
			}
		}

		class UserPopulateManyCustomRelationKey extends LegatoEntity {
			@LegatoIndex({
				unique: true,
			})
			firstname: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdCustomRelationKey,
				targetKey: 'customId',
			})
			jobId: ObjectID
			job?: JobPopulateIdCustomRelationKey

			@LegatoRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateIdCustomRelationKey,
				targetKey: 'customId',
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateIdCustomRelationKey[]

			constructor(firstname: string, jobId: ObjectID) {
				super()
				this.firstname = firstname
				this.jobId = jobId
				this.jobIds = [jobId]
			}

			addJobId(jobId: ObjectID) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job1 = new JobPopulateIdCustomRelationKey('js dev')
		const job1Id = await job1.insert(connection)

		const job2 = new JobPopulateIdCustomRelationKey('php dev')
		await job2.insert(connection)

		for (let i = 0; i < 5; i++) {
			const user = new UserPopulateManyCustomRelationKey(
				'Damien' + i,
				job1.customId
			)
			user.addJobId(job2.customId)
			await user.insert(connection)
		}

		const users = await UserPopulateManyCustomRelationKey.find(connection, {})
		const populatedUsers = await users.populate(connection)

		expect(populatedUsers.length).toEqual(5)

		for (const populatedUser of populatedUsers) {
			expect(populatedUser.job).toStrictEqual({
				_id: job1Id,
				name: 'js dev',
				customId: job1.customId,
			})
			expect(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[]).length
			).toEqual(2)
			expect(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[0]
			).not.toStrictEqual(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[1]
			)
		}
	})

	it('should throw an error if try to populate an unknown collection', async () => {
		class UserPopulateUnknownCollection extends LegatoEntity {
			firsname: string = 'Damien'

			constructor() {
				super()
				this._id = new ObjectID()
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserPopulateUnknownCollection()

		let hasError = false
		try {
			await user.populate(connection)
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				'Collection userpopulateunknowncollection does not exist.'
			)
		}

		expect(hasError).toEqual(true)
	})
})
