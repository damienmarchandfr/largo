import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { LegatoField } from '../../../../decorators/field.decorator'
import { InsertChildTest } from './InsertChild.entity.test'
import { ObjectID } from 'mongodb'

export class InsertParentTest extends LegatoEntity {
	@LegatoField()
	name: string

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: InsertChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: InsertChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: InsertChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: InsertChildTest,
	})
	childIdsNoCheck: ObjectID[] = []

	// Use string for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childString',
		targetType: InsertChildTest,
		targetKey: 'stringId',
	})
	childIdString: string | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenString',
		targetType: InsertChildTest,
		targetKey: 'stringId',
	})
	childIdsString: string[] = []

	// Use number for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childNumber',
		targetType: InsertChildTest,
		targetKey: 'numberId',
	})
	childIdNumber: number | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenNumber',
		targetType: InsertChildTest,
		targetKey: 'numberId',
	})
	childIdsNumber: number[] = []

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
