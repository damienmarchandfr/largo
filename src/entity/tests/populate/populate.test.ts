import { LegatoEntity } from '../..'
import { LegatoField } from '../../../decorators/field.decorator'
import { LegatoRelation } from '../../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { LegatoConnection } from '../../../connection'
import { LegatoIndex } from '../../../decorators/index.decorator'

const databaseName = 'populateTest'

describe('populate method', () => {
	it('should populate with _id by default', async () => {
		class JobPopulateDefaultId extends LegatoEntity {
			@LegatoField()
			name: string

			constructor(name: string) {
				super()
				this.name = name
			}
		}

		class UserPopulateDefaultId extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateDefaultId,
			})
			jobId: ObjectID
			job?: JobPopulateDefaultId

			@LegatoRelation({
				populatedKey: 'job2',
				targetType: JobPopulateDefaultId,
			})
			jobId2: ObjectID
			job2?: JobPopulateDefaultId

			@LegatoRelation({
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

		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job = new JobPopulateDefaultId('js dev')
		const jobId = await job.insert()

		const job2 = new JobPopulateDefaultId('php dev')
		const job2id = await job2.insert()

		const user = new UserPopulateDefaultId(jobId, job2id)
		await user.insert()

		const userPopulated = await user.populate()
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
		class JobPopulateCustomKey extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoField()
			customJobId: ObjectID

			constructor(name: string) {
				super()
				this.customJobId = new ObjectID()
				this.name = name
			}
		}

		class UserPopulateCustomKey extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateCustomKey,
				targetKey: 'customJobId',
			})
			jobId: ObjectID
			job?: JobPopulateCustomKey

			@LegatoRelation({
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

		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job = new JobPopulateCustomKey('js dev')
		const generatedJobId = await job.insert()
		const jobId = job.customJobId

		const job2 = new JobPopulateCustomKey('c++ dev')
		await job2.insert()
		const job2Id = job2.customJobId

		const user = new UserPopulateCustomKey(jobId)
		user.addJob(job2Id)
		await user.insert()

		const userPopulated = await user.populate()

		expect(userPopulated.job).toStrictEqual({
			_id: generatedJobId,
			name: 'js dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)
		expect((userPopulated.jobs as JobPopulateCustomKey[]).length).toEqual(2)
	})

	it('should populate with string as id', async () => {
		class JobPopulateIdString extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoIndex({
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

		class UserPopulateIdString extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdString,
				targetKey: 'customJobId',
			})
			jobId: string
			job?: JobPopulateIdString

			@LegatoRelation({
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

		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create job
		const job = new JobPopulateIdString()
		const jobIdCreated = await job.insert()

		const job2 = new JobPopulateIdString()
		await job2.insert()

		const user = new UserPopulateIdString(job.customJobId)
		user.addCustomJobId(job2.customJobId)
		await user.insert()

		const userPopulated = await user.populate()

		expect(userPopulated.job).toStrictEqual({
			_id: jobIdCreated,
			name: 'C# dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)

		expect((userPopulated.jobs as JobPopulateIdString[]).length).toEqual(2)
	})

	it('should populate with number as id', async () => {
		class JobPopulateIdNumber extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoIndex({
				unique: true,
			})
			customJobId: number

			constructor(customJobId: number) {
				super()
				this.name = 'C# dev'
				this.customJobId = customJobId
			}
		}

		class UserPopulateIdNumber extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdNumber,
				targetKey: 'customJobId',
			})
			jobId: number
			job?: JobPopulateIdNumber

			@LegatoRelation({
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

		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create job
		const job = new JobPopulateIdNumber(1)
		const jobIdCreated = await job.insert()

		const job2 = new JobPopulateIdNumber(2)
		await job2.insert()

		const user = new UserPopulateIdNumber(job.customJobId)
		user.addJobId(job2.customJobId)
		await user.insert()

		const userPopulated = await user.populate()

		expect(userPopulated.job).toStrictEqual({
			_id: jobIdCreated,
			name: 'C# dev',
			customJobId: job.customJobId,
		})

		expect(userPopulated.jobId).toEqual(job.customJobId)

		expect((userPopulated.jobs as JobPopulateIdNumber[]).length).toEqual(2)
	})

	it('should return object if no relation', async () => {
		class UserPopulateNoRelation extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserPopulateNoRelation()
		await user.insert()

		const populated = await user.populate()

		expect(user.toPlainObj()).toStrictEqual(populated)
	})
})
