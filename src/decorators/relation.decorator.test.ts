import { MongODMRelation } from './relation.decorator'
import { MongODMField } from './field.decorator'
import { mongODMetaDataStorage } from '..'
import { MongODMIndex } from './index.decorator'
import { ObjectID } from 'mongodb'
import { MongODMEntity } from '../entity'
import { connect } from 'http2';

describe('Relation decorator', () => {
	it('should add meta data', () => {
		class JobRelationDecorator extends MongODMEntity {
			@MongODMField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecorator extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobRelationDecorator,
			})
			jobId: Object | null = null

			constructor() {
				super()
				this.email = 'damien@mail.com'
			}
		}

		const relationMeta = mongODMetaDataStorage().mongODMRelationsMetas
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
		class JobRelationDecoratorIdNotSet extends MongODMEntity {
			@MongODMField()
			companyName: string

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdNotSet extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
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
			mongODMetaDataStorage().mongODMRelationsMetas
				.userrelationdecoratoridnotset[0].targetKey
		).toEqual('_id')
	})

	it('should set other relation key if set by user', () => {
		class JobRelationDecoratorIdSet extends MongODMEntity {
			@MongODMField()
			companyName: string

			@MongODMIndex({
				unique: true,
			})
			id: ObjectID | null = null

			constructor() {
				super()
				this.companyName = 'yolo company'
			}
		}

		class UserRelationDecoratorIdSet extends MongODMEntity {
			@MongODMField()
			email: string

			@MongODMRelation({
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
			mongODMetaDataStorage().mongODMRelationsMetas
				.userrelationdecoratoridset[0].targetKey
		).toEqual('id')
	})
})
