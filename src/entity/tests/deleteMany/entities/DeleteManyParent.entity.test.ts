import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../../../decorators/field.decorator'
import { DeleteManyChildTest } from './DeleteManyChild.entity.test'

export class DeleteManyParentTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteManyParent'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: DeleteManyChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: DeleteManyChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: DeleteManyChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: DeleteManyChildTest,
	})
	childIdsNoCheck: ObjectID[] = []
}
