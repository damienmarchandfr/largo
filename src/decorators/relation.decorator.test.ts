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
			})
			jobId: Object | null = null

			constructor() {
				super()
			}
		}

		const relationMeta = LegatoMetaDataStorage().LegatoRelationsMetas
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
				.userrelationdecoratoridnotset[0].targetKey
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
			LegatoMetaDataStorage().LegatoRelationsMetas.userrelationdecoratoridset[0]
				.targetKey
		).toEqual('id')
	})
})
