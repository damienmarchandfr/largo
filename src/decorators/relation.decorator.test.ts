import { MongORMRelation } from './relation.decorator'
import { MongORMField } from './field.decorator'
import { mongORMetaDataStorage } from '..'
import { MongORMIndex } from './index.decorator'
import { ObjectID } from 'mongodb'

describe('Relation decorator', () => {
	it('should add meta data', () => {
		class JobRelationDecorator {
			@MongORMField()
			companyName: string

			constructor() {
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecorator {
			@MongORMField()
			email: string

			@MongORMRelation({
				populatedKey: 'job',
				targetType: JobRelationDecorator,
			})
			jobId: Object | null = null

			constructor() {
				this.email = 'damien@mail.com'
			}
		}

		const relationMeta = mongORMetaDataStorage().mongORMRelationsMetas
			.userrelationdecorator

		expect(relationMeta.length).toEqual(1)
		expect(relationMeta[0]).toStrictEqual({
			key: 'jobId',
			populatedKey: 'job',
			targetKey: '_id',
			targetType: JobRelationDecorator,
		})
	})

	it('should set _id as relation key by default', () => {
		class JobRelationDecoratorIdNotSet {
			@MongORMField()
			companyName: string

			constructor() {
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdNotSet {
			@MongORMField()
			email: string

			@MongORMRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorIdNotSet,
			})
			jobId: Object | null = null

			constructor() {
				this.email = 'damien@mail.com'
			}
		}

		expect(
			mongORMetaDataStorage().mongORMRelationsMetas
				.userrelationdecoratoridnotset[0].targetKey
		).toEqual('_id')
	})

	it('should set other relation key if set by user', () => {
		class JobRelationDecoratorIdSet {
			@MongORMField()
			companyName: string

			@MongORMIndex({
				unique: true,
			})
			id: ObjectID | null = null

			constructor() {
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdSet {
			@MongORMField()
			email: string

			@MongORMRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorIdSet,
				targetKey: 'id',
			})
			jobId: Object | null = null

			constructor() {
				this.email = 'damien@mail.com'
			}
		}

		expect(
			mongORMetaDataStorage().mongORMRelationsMetas
				.userrelationdecoratoridset[0].targetKey
		).toEqual('id')
	})
})
