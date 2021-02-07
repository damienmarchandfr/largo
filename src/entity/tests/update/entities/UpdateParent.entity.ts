import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { UpdateChildTest } from './UpdateChild.entity'

export class UpdateParentTest extends LegatoEntity {
	@LegatoField()
	name = 'john'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: UpdateChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: UpdateChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: UpdateChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: UpdateChildTest,
	})
	childIdsNoCheck: ObjectID[] = []

	// Use string for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childString',
		targetType: UpdateChildTest,
		targetKey: 'stringId',
	})
	childIdString: string | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenString',
		targetType: UpdateChildTest,
		targetKey: 'stringId',
	})
	childIdsString: string[] = []

	// Use number for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childNumber',
		targetType: UpdateChildTest,
		targetKey: 'numberId',
	})
	childIdNumber: number | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenNumber',
		targetType: UpdateChildTest,
		targetKey: 'numberId',
	})
	childIdsNumber: number[] = []
}
