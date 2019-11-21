import { LegatoEntity } from '../../..'
import { LegatoRelation } from '../../../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../../../decorators/field.decorator'
import { UpdateManyChildTest } from './UpdateManyChild.entity.test'

export class UpdateParentTest extends LegatoEntity {
	@LegatoField()
	name: string

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'child',
		targetType: UpdateManyChildTest,
	})
	childId: ObjectID | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'children',
		targetType: UpdateManyChildTest,
	})
	childIds: ObjectID[] = []

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childNoCheck',
		targetType: UpdateManyChildTest,
	})
	childIdNoCheck: ObjectID | null = null

	@LegatoRelation({
		checkRelation: false,
		populatedKey: 'childrenNoCheck',
		targetType: UpdateManyChildTest,
	})
	childIdsNoCheck: ObjectID[] = []

	// Use string for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childString',
		targetType: UpdateManyChildTest,
		targetKey: 'stringId',
	})
	childIdString: string | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenString',
		targetType: UpdateManyChildTest,
		targetKey: 'stringId',
	})
	childIdsString: string[] = []

	// Use number for relation
	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childNumber',
		targetType: UpdateManyChildTest,
		targetKey: 'numberId',
	})
	childIdNumber: number | null = null

	@LegatoRelation({
		checkRelation: true,
		populatedKey: 'childrenNumber',
		targetType: UpdateManyChildTest,
		targetKey: 'numberId',
	})
	childIdsNumber: number[] = []

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
