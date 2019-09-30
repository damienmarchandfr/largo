import { MongODMEntity } from '../entity'
import { MongODMField } from '../../decorators/field.decorator'
import { MongODMRelation } from '../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { MongODMConnection } from '../../connection/connection'
import { MongODMIndex } from '../../decorators/index.decorator'

const databaseName = 'populateTest'

describe('populate method', () => {
	it('should populate with _id by default', async () => {
		class JobPopulateDefaultId extends MongODMEntity {
			@MongODMField()
			name: string

			constructor(name: string) {
				super()
				this.name = name
			}
		}

		class UserPopulateDefaultId extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateDefaultId,
			})
			jobId: ObjectID
			job?: JobPopulateDefaultId

			@MongODMRelation({
				populatedKey: 'job2',
				targetType: JobPopulateDefaultId,
			})
			jobId2: ObjectID
			job2?: JobPopulateDefaultId

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateDefaultId,
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateDefaultId[]

			constructor(savedJobId: ObjectID, savedJobId2: ObjectID) {
				super()
				this.firstname = 'Damien'
				this.jobId = savedJobId
				this.jobId2 = savedJobId2
				this.jobIds = [this.jobId, this.jobId2]
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job = new JobPopulateDefaultId('js dev')
		const jobId = await job.insert(connection)

		const job2 = new JobPopulateDefaultId('php dev')
		const job2id = await job2.insert(connection)

		const user = new UserPopulateDefaultId(jobId, job2id)
		await user.insert(connection)

		const userPopulated = await user.populate<UserPopulateDefaultId>(connection)
		expect(userPopulated.job).toStrictEqual({
			_id: jobId,
			name: 'js dev',
		})
		expect(userPopulated.job2).toStrictEqual({
			_id: job2id,
			name: 'php dev',
		})

		expect((userPopulated.jobs as JobPopulateDefaultId[]).length).toEqual(2)
	})

	it('should populate with other key for relation', async () => {
		class JobPopulateCustomKey extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMField()
			customJobId: ObjectID

			constructor(name: string) {
				super()
				this.customJobId = new ObjectID()
				this.name = name
			}
		}

		class UserPopulateCustomKey extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateCustomKey,
				targetKey: 'customJobId',
			})
			jobId: ObjectID
			job?: JobPopulateCustomKey

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateCustomKey,
				targetKey: 'customJobId',
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateCustomKey[]

			constructor(savedJobId: ObjectID) {
				super()
				this.firstname = 'Damien'
				this.jobId = savedJobId
				this.jobIds = [savedJobId]
			}

			addJob(savedJobId: ObjectID) {
				this.jobIds.push(savedJobId)
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job = new JobPopulateCustomKey('js dev')
		const generatedJobId = await job.insert(connection)
		const jobId = job.customJobId

		const job2 = new JobPopulateCustomKey('c++ dev')
		await job2.insert(connection)
		const job2Id = job2.customJobId

		const user = new UserPopulateCustomKey(jobId)
		user.addJob(job2Id)
		await user.insert(connection)

		const userPopulated = await user.populate<UserPopulateCustomKey>(connection)

		expect(userPopulated.job).toStrictEqual({
			_id: generatedJobId,
			name: 'js dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)
		expect((userPopulated.jobs as JobPopulateCustomKey[]).length).toEqual(2)
	})

	it('should populate with string as id', async () => {
		class JobPopulateIdString extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMIndex({
				unique: true,
			})
			customJobId: string

			constructor() {
				super()
				this.name = 'C# dev'
				this.customJobId =
					'customValue' +
					Math.random()
						.toString(36)
						.substring(2, 15)
			}
		}

		class UserPopulateIdString extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdString,
				targetKey: 'customJobId',
			})
			jobId: string
			job?: JobPopulateIdString

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateIdString,
				targetKey: 'customJobId',
			})
			jobIds: string[]
			jobs?: JobPopulateIdString[]

			constructor(customJobId: string) {
				super()
				this.email = 'damien@marchand.fr'
				this.jobId = customJobId
				this.jobIds = [customJobId]
			}

			addCustomJobId(jobId: string) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create job
		const job = new JobPopulateIdString()
		const jobIdCreated = await job.insert(connection)

		const job2 = new JobPopulateIdString()
		await job2.insert(connection)

		const user = new UserPopulateIdString(job.customJobId)
		user.addCustomJobId(job2.customJobId)
		await user.insert(connection)

		const userPopulated = await user.populate<UserPopulateIdString>(connection)

		expect(userPopulated.job).toStrictEqual({
			_id: jobIdCreated,
			name: 'C# dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)

		expect((userPopulated.jobs as JobPopulateIdString[]).length).toEqual(2)
	})

	it('should populate with number as id', async () => {
		class JobPopulateIdNumber extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMIndex({
				unique: true,
			})
			customJobId: number

			constructor(customJobId: number) {
				super()
				this.name = 'C# dev'
				this.customJobId = customJobId
			}
		}

		class UserPopulateIdNumber extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdNumber,
				targetKey: 'customJobId',
			})
			jobId: number
			job?: JobPopulateIdNumber

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateIdNumber,
				targetKey: 'customJobId',
			})
			jobIds: number[]
			jobs?: JobPopulateIdNumber[]

			constructor(jobId: number) {
				super()
				this.email = 'damien@marchand.fr'
				this.jobId = jobId
				this.jobIds = [jobId]
			}

			addJobId(jobId: number) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create job
		const job = new JobPopulateIdNumber(1)
		const jobIdCreated = await job.insert(connection)

		const job2 = new JobPopulateIdNumber(2)
		await job2.insert(connection)

		const user = new UserPopulateIdNumber(job.customJobId)
		user.addJobId(job2.customJobId)
		await user.insert(connection)

		const userPopulated = await user.populate<UserPopulateIdNumber>(connection)

		expect(userPopulated.job).toStrictEqual({
			_id: jobIdCreated,
			name: 'C# dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)

		expect((userPopulated.jobs as JobPopulateIdNumber[]).length).toEqual(2)
	})
})
