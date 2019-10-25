import { LegatoEntity } from '../../..'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { NoChildEntityTest } from './NoChild.entity.test'

export class ChildEntityTest extends LegatoEntity {
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

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'lastChild',
		targetType: NoChildEntityTest,
	})
	lastChildId: ObjectID | null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'lastChildren',
		targetType: NoChildEntityTest,
	})
	lastChildIds: ObjectID[]

	constructor() {
		super()
		this.childId = null
		this.childIds = []

		this.lastChildId = null
		this.lastChildIds = []
	}

	setChild(childId: ObjectID) {
		this.childId = childId
	}

	setChildren(childIds: ObjectID[]) {
		this.childIds = childIds
	}

	setLastChild(lastChildId: ObjectID) {
		this.lastChildId = lastChildId
	}

	setLastChildren(lastChildIds: ObjectID[]) {
		this.lastChildIds = lastChildIds
	}
}
