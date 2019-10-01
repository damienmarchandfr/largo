import {
	errorCode,
	LegatoConnectionError,
	LegatoCollectionDoesNotExistError,
	LegatoDatabaseNameProtectedError,
	LegatoRelationError,
	LegatoAlreadyInsertedError,
	LegatoRelationsError,
} from '.'
import { LegatoEntity } from '../entity'
import { LegatoField } from '../decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../decorators/relation.decorator'
import { LegatoConnection } from '../connection'
import { LegatoIndex } from '../decorators/index.decorator'

const databaseName = 'errorsTest'

describe('Legato custom errors', () => {
	it('should set custom code', () => {
		class UserErrorCustomCode extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'friends',
				targetType: UserErrorCustomCode,
			})
			friendIds: ObjectID[]
			friends?: UserErrorCustomCode[]

			constructor() {
				super()
				this.firstname = 'Damien'
				this.friendIds = []
			}

			addFriend(userId: ObjectID) {
				this.friendIds.push(userId)
			}
		}

		class JobErrorCustomCode extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoRelation({
				populatedKey: 'employee',
				targetType: UserErrorCustomCode,
			})
			employeeId: ObjectID | null = null
			employee?: UserErrorCustomCode

			constructor() {
				super()
				this.name = 'Web dev'
				this.employeeId = new ObjectID()
			}
		}

		const user = new UserErrorCustomCode()
		const friendId = new ObjectID()
		user.addFriend(friendId)

		const job = new JobErrorCustomCode()

		const errors: Array<[errorCode, Error]> = [
			['Legato_ERROR_404', new LegatoCollectionDoesNotExistError('yolo')],
			['Legato_ERROR_500', new LegatoConnectionError('NOT_CONNECTED')],
			['Legato_ERROR_500', new LegatoConnectionError('ALREADY_CONNECTED')],
			[
				'Legato_ERROR_500',
				new LegatoConnectionError('NOT_CONNECTED_CANNOT_DISCONNECT'),
			],
			['Legato_ERROR_403', new LegatoDatabaseNameProtectedError('admin')],
			['Legato_ERROR_502', new LegatoRelationError(job, 'employeeId', user)],
			[
				'Legato_ERROR_502',
				new LegatoRelationsError([friendId], job, 'employeeId', user),
			],
			['Legato_ERROR_409', new LegatoAlreadyInsertedError(new ObjectID())],
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).code)
		}
	})

	it('should create a custom message', () => {
		class UserErrorCustomMessage extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'friends',
				targetType: UserErrorCustomMessage,
			})
			friendIds: ObjectID[]
			friends?: UserErrorCustomMessage[]

			constructor() {
				super()
				this.firstname = 'Damien'
				this.friendIds = []
			}

			addFriend(userId: ObjectID) {
				this.friendIds.push(userId)
			}
		}

		class JobErrorCustomMessage extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoRelation({
				populatedKey: 'employee',
				targetType: UserErrorCustomMessage,
			})
			employeeId: ObjectID | null = null
			employee?: UserErrorCustomMessage

			constructor() {
				super()
				this.name = 'Web dev'
				this.employeeId = new ObjectID()
			}
		}

		const user = new UserErrorCustomMessage()
		const fakeFriendId = new ObjectID()
		const realFriendIds = [new ObjectID(), new ObjectID()]
		user.addFriend(realFriendIds[0])
		user.addFriend(realFriendIds[1])
		user.addFriend(fakeFriendId)

		const job = new JobErrorCustomMessage()
		const insertedId = new ObjectID()

		const errors: Array<[string, Error]> = [
			[
				`Collection yolo does not exist.`,
				new LegatoCollectionDoesNotExistError('yolo'),
			],
			[
				`Database name 'admin' is protected.`,
				new LegatoDatabaseNameProtectedError('admin'),
			],
			[
				`You set employeeId : ${job.employeeId} on object JobErrorCustomMessage. UserErrorCustomMessage with _id : ${job.employeeId} does not exist.`,
				new LegatoRelationError(job, 'employeeId', user),
			],
			[
				`You have already inserted this object with _id : ${insertedId.toHexString()} .`,
				new LegatoAlreadyInsertedError(insertedId),
			],
			[
				`You set friendIds : [${user.friendIds}] on object UserErrorCustomMessage. UserErrorCustomMessage with _id in [${fakeFriendId}] do not exist.`,
				new LegatoRelationsError([fakeFriendId], user, 'friendIds', user),
			],
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).message)
		}
	})

	it('should return relation error', async () => {
		// Use _id a relation key
		class JobRelationError extends LegatoEntity {
			@LegatoField()
			name: string

			constructor(name: string) {
				super()
				this.name = name
			}
		}

		class HobbyRelationError extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoIndex({
				unique: true,
			})
			customId: ObjectID

			constructor(name: string) {
				super()
				this.name = name
				this.customId = new ObjectID()
			}
		}

		// User has a job
		class UserRelationError extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationError,
			})
			jobId: ObjectID | null = null
			job?: JobRelationError

			@LegatoRelation({
				populatedKey: 'hobby',
				targetType: HobbyRelationError,
				targetKey: 'customId',
			})
			hobbyId: ObjectID | null = null
			hobby?: HobbyRelationError

			constructor(firstname: string) {
				super()
				this.firstname = firstname
			}

			addHobby() {
				this.hobbyId = new ObjectID()
			}

			addJob() {
				this.jobId = new ObjectID()
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserRelationError('damien')
		user.addJob()

		try {
			await user.insert(connection)
		} catch (error) {
			const err = error as LegatoRelationError
			expect(err).toBeInstanceOf(LegatoRelationError)
			expect(err.source).toStrictEqual(user)
			expect(err.sourceKey).toEqual('jobId')
			expect(err.target).toBeInstanceOf(JobRelationError)
			expect(err.value).toStrictEqual(user.jobId as ObjectID)
			expect(err.targetKey).toEqual('_id')
		}

		const user2 = new UserRelationError('jeremy')
		user2.addHobby()

		try {
			await user2.insert(connection)
		} catch (error) {
			const err = error as LegatoRelationError
			expect(err).toBeInstanceOf(LegatoRelationError)
			expect(err.source).toStrictEqual(user2)
			expect(err.sourceKey).toEqual('hobbyId')
			expect(err.target).toBeInstanceOf(HobbyRelationError)
			expect(err.value).toStrictEqual(user2.hobbyId as ObjectID)
			expect(err.targetKey).toEqual('customId')
		}
	})

	it('should return relations error', async () => {
		// Use _id a relation key
		class JobRelationsError extends LegatoEntity {
			@LegatoField()
			name: string

			constructor(name: string) {
				super()
				this.name = name
			}
		}

		class HobbyRelationsError extends LegatoEntity {
			@LegatoField()
			name: string

			@LegatoIndex({
				unique: true,
			})
			customId: ObjectID

			constructor(name: string) {
				super()
				this.name = name
				this.customId = new ObjectID()
			}
		}

		// User has a job
		class UserRelationsError extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoRelation({
				populatedKey: 'jobs',
				targetType: JobRelationsError,
			})
			jobIds: ObjectID[] = []
			jobs?: JobRelationsError[]

			@LegatoRelation({
				populatedKey: 'hobbies',
				targetType: HobbyRelationsError,
				targetKey: 'customId',
			})
			hobbyIds: ObjectID[] = []
			hobbies?: HobbyRelationsError[]

			constructor(firstname: string) {
				super()
				this.firstname = firstname
			}

			addHobby() {
				this.hobbyIds.push(new ObjectID())
			}

			addJob() {
				this.jobIds.push(new ObjectID())
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserRelationsError('damien')
		user.addJob()

		try {
			await user.insert(connection)
		} catch (error) {
			const err = error as LegatoRelationsError
			expect(err).toBeInstanceOf(LegatoRelationsError)
			expect(err.source).toStrictEqual(user)
			expect(err.sourceKey).toEqual('jobIds')
			expect(err.diff).toStrictEqual(user.jobIds)
			expect(err.target).toBeInstanceOf(JobRelationsError)
			expect(err.targetKey).toEqual('_id')
		}

		const user2 = new UserRelationsError('jeremy')
		user2.addHobby()

		try {
			await user2.insert(connection)
		} catch (error) {
			const err = error as LegatoRelationsError
			expect(err).toBeInstanceOf(LegatoRelationsError)
			expect(err.source).toStrictEqual(user2)
			expect(err.sourceKey).toEqual('hobbyIds')
			expect(err.diff).toStrictEqual(user2.hobbyIds)
			expect(err.target).toBeInstanceOf(HobbyRelationsError)
			expect(err.targetKey).toEqual('customId')
		}
	})
})
