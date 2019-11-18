import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { LegatoField } from '../../../../decorators/field.decorator'
import { InserChildTest } from './InsertChild.entity.test'
import { ObjectID } from 'mongodb'

export class InsertParentTest extends LegatoEntity {
	@LegatoField()
	name = 'InsertParent'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: InserChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: InserChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: InserChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: InserChildTest,
	})
	childIdsNoCheck: ObjectID[] = []
}
