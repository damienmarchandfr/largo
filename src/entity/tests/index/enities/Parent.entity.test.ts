import { LegatoEntity } from '../../..'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { ChildEntityTest } from './Child.entity.test'

export class ParentEntityTest extends LegatoEntity {
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: ChildEntityTest,
	})
	childId: ObjectID | null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: ChildEntityTest,
	})
	childIds: ObjectID[]

	constructor() {
		super()
		this.childId = null
		this.childIds = []
	}

	setChild(childId: ObjectID) {
		this.childId = childId
	}

	setChildren(childIds: ObjectID[]) {
		this.childIds = childIds
	}
}
