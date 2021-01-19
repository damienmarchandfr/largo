import { LegatoMetaDataStorage } from '../..'
import {
	RelationDecoratorParentTest,
	RelationDecoratorChildTest,
} from './Decorator.entity'

describe('Relation decorator', () => {
	it('should add meta data', () => {
		const relationMeta = LegatoMetaDataStorage().LegatoRelationsMetas
			.RelationDecoratorParentTest

		expect(relationMeta.length).toEqual(3)

		const metas = [
			{
				key: 'defaultAndNotCheckRelationId',
				populatedKey: 'defaultAndNotCheckRelation',
				populatedType: RelationDecoratorParentTest,
				targetKey: '_id',
				targetType: RelationDecoratorChildTest,
				checkRelation: false,
			},
			{
				key: 'defaultAndCheckRelationId',
				populatedKey: 'defaultAndCheckRelation',
				populatedType: RelationDecoratorParentTest,
				targetKey: '_id',
				targetType: RelationDecoratorChildTest,
				checkRelation: true,
			},
			{
				key: 'notUseMongoIdId',
				populatedKey: 'notUseMongoIdId',
				populatedType: RelationDecoratorParentTest,
				targetKey: 'id',
				targetType: RelationDecoratorChildTest,
				checkRelation: true,
			},
		]

		metas.forEach((meta) => {
			expect(relationMeta).toContainEqual(meta)
		})
	})
})
