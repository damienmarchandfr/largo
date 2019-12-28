import { LegatoEntity } from '../../../entity'
import { LegatoRelation } from '../../../decorators/relation.decorator'
import { LegatoField } from '../../../decorators/field.decorator'
import { ChildEntityArrayTest } from './ChildEntityArray.entity.test'
import { ObjectID } from 'mongodb'

export class ParentEntityArrayTest extends LegatoEntity {
	@LegatoField()
	field: string = 'john doe'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: ChildEntityArrayTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: ChildEntityArrayTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: ChildEntityArrayTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: ChildEntityArrayTest,
	})
	childIdsNoCheck: ObjectID[] = []

	// Use string for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childString',
		targetType: ChildEntityArrayTest,
		targetKey: 'stringId',
	})
	childIdString: string | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenString',
		targetType: ChildEntityArrayTest,
		targetKey: 'stringId',
	})
	childIdsString: string[] = []

	// Use number for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childNumber',
		targetType: ChildEntityArrayTest,
		targetKey: 'numberId',
	})
	childIdNumber: number | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenNumber',
		targetType: ChildEntityArrayTest,
		targetKey: 'numberId',
	})
	childIdsNumber: number[] = []
}
