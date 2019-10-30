import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { DeleteChildTest } from './DeleteChild.entity.test'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteParentTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteParent'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: DeleteChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: DeleteChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: DeleteChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: DeleteChildTest,
	})
	childIdsNoCheck: ObjectID[] = []
}
