import { LegatoEntity } from '../../..'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { DeleteNoChildTest } from './DeleteNoChild.entity.test'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteChildTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteChild'

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childWithNoChild',
		targetType: DeleteNoChildTest,
	})
	childNotParentId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenWithNoChild',
		targetType: DeleteNoChildTest,
	})
	childNotParentIds: ObjectID[] = []

	setChildNotParentId(id: ObjectID) {
		this.childNotParentId = id
	}

	setChildNotParentIds(ids: ObjectID[]) {
		this.childNotParentIds = ids
	}
}
