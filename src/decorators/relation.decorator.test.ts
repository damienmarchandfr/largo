import { LegatoRelation } from './relation.decorator'
import { LegatoField } from './field.decorator'
import { LegatoMetaDataStorage } from '..'
import { LegatoIndex } from './index.decorator'
import { ObjectID } from 'mongodb'
import { LegatoEntity } from '../entity'

describe('Relation decorator', () => {
	it('should add meta data', () => {
		class JobRelationDecorator extends LegatoEntity {
			@LegatoField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecorator extends LegatoEntity {
			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecorator,
				checkRelation: false,
			})
			jobId: Object | null = null

			constructor() {
				super()
			}
		}

		const relationMeta = LegatoMetaDataStorage().LegatoRelationsMetas
			.UserRelationDecorator

		expect(relationMeta.length).toEqual(1)
		expect(relationMeta[0]).toStrictEqual({
			key: 'jobId',
			populatedKey: 'job',
			targetKey: '_id',
			targetType: JobRelationDecorator,
			checkRelation: false,
		})
	})

	it('should set _id as relation key by default', () => {
		class JobRelationDecoratorIdNotSet extends LegatoEntity {
			@LegatoField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdNotSet extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorIdNotSet,
			})
			jobId: Object | null = null

			constructor() {
				super()
				this.email = 'damien@mail.com'
			}
		}

		expect(
			LegatoMetaDataStorage().LegatoRelationsMetas
				.UserRelationDecoratorIdNotSet[0].targetKey
		).toEqual('_id')
	})

	it('should set other relation key if set by user', () => {
		class JobRelationDecoratorIdSet extends LegatoEntity {
			@LegatoField()
			companyName: string

			@LegatoIndex({
				unique: true,
			})
			id: ObjectID | null = null

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdSet extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorIdSet,
				targetKey: 'id',
			})
			jobId: ObjectID | null = null

			constructor() {
				super()
				this.email = 'damien@mail.com'
			}
		}

		expect(
			LegatoMetaDataStorage().LegatoRelationsMetas.UserRelationDecoratorIdSet[0]
				.targetKey
		).toEqual('id')
	})

	it('should set check relation to true by default', () => {
		class JobRelationDecoratorCheckSet extends LegatoEntity {
			@LegatoField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorCheckSet extends LegatoEntity {
			@LegatoField()
			email: string

			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobRelationDecoratorCheckSet,
			})
			jobId: ObjectID | null = null

			constructor() {
				super()
				this.email = 'damien@mail.com'
			}
		}

		expect(
			LegatoMetaDataStorage().LegatoRelationsMetas
				.UserRelationDecoratorCheckSet[0].checkRelation
		).toEqual(true)
	})
})
