import {
	errorCode,
	MongODMConnectionError,
	MongODMCollectionDoesNotExistError,
	MongODMDatabaseNameProtectedError,
	MongODMRelationError,
	MongODMAlreadyInsertedError,
	MongODMRelationsError,
} from './errors'
import { MongODMEntity } from '../entity/entity'
import { MongODMField } from '../decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from '../decorators/relation.decorator'

describe('MongODM custom errors', () => {
	it('should set custom code', () => {
		class UserErrorCustomCode extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMRelation({
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

		class JobErrorCustomCode extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMRelation({
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
			['MONGODM_ERROR_404', new MongODMCollectionDoesNotExistError('yolo')],
			['MONGODM_ERROR_500', new MongODMConnectionError('NOT_CONNECTED')],
			['MONGODM_ERROR_500', new MongODMConnectionError('ALREADY_CONNECTED')],
			[
				'MONGODM_ERROR_500',
				new MongODMConnectionError('NOT_CONNECTED_CANNOT_DISCONNECT'),
			],
			['MONGODM_ERROR_403', new MongODMDatabaseNameProtectedError('admin')],
			['MONGODM_ERROR_502', new MongODMRelationError(job, 'employeeId', user)],
			[
				'MONGODM_ERROR_502',
				new MongODMRelationsError([friendId], job, 'employeeId', user),
			],
			['MONGODM_ERROR_409', new MongODMAlreadyInsertedError(new ObjectID())],
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).code)
		}
	})

	it('should create a custom message', () => {
		class UserErrorCustomMessage extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMRelation({
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

		class JobErrorCustomMessage extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMRelation({
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
				new MongODMCollectionDoesNotExistError('yolo'),
			],
			[
				`Database name 'admin' is protected.`,
				new MongODMDatabaseNameProtectedError('admin'),
			],
			[
				`You set employeeId : ${job.employeeId} on object JobErrorCustomMessage. UserErrorCustomMessage with _id : ${job.employeeId} does not exist.`,
				new MongODMRelationError(job, 'employeeId', user),
			],
			[
				`You have already inserted this object with _id : ${insertedId.toHexString()} .`,
				new MongODMAlreadyInsertedError(insertedId),
			],
			[
				`You set friendIds : [${user.friendIds}] on object UserErrorCustomMessage. UserErrorCustomMessage with _id in [${fakeFriendId}] do not exist.`,
				new MongODMRelationsError([fakeFriendId], user, 'friendIds', user),
			],
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).message)
		}
	})
})
