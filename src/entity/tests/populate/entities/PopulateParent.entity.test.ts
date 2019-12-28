import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { LegatoField } from '../../../../decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { PopulateChildTest } from './PopulateChild.entity.test'

export class PopulateParentTest extends LegatoEntity {
	@LegatoField()
	field: string = 'parent'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: PopulateChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: PopulateChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: PopulateChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: PopulateChildTest,
	})
	childIdsNoCheck: ObjectID[] = []

	// Use string for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childString',
		targetType: PopulateChildTest,
		targetKey: 'stringId',
	})
	childIdString: string | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenString',
		targetType: PopulateChildTest,
		targetKey: 'stringId',
	})
	childIdsString: string[] = []

	// Use number for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childNumber',
		targetType: PopulateChildTest,
		targetKey: 'numberId',
	})
	childIdNumber: number | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenNumber',
		targetType: PopulateChildTest,
		targetKey: 'numberId',
	})
	childIdsNumber: number[] = []
}
