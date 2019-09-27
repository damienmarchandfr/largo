import {
	errorCode,
	MongODMConnectionError,
	MongODMCollectionDoesNotExistError,
	MongODMDatabaseNameProtectedError,
	MongODMRelationError,
} from './errors'
import { MongODMEntity } from './entity'
import { MongODMField } from './decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from './decorators/relation.decorator'

describe('MongODM custom errors', () => {
	it('should set custom code', () => {
		class UserErrorCustomCode extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
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
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).code)
		}
	})

	it('should create a custom message', () => {
		class UserErrorCustomMessage extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
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
		const job = new JobErrorCustomMessage()

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
				`You set employeeId : ${job.employeeId} on object JobErrorCustomMessage. UserErrorCustomMessage with _id : ${job.employeeId} does not exists.`,
				new MongODMRelationError(job, 'employeeId', user),
			],
		]

		for (const error of errors) {
			expect(error[0]).toEqual((error[1] as any).message)
		}
	})
})
