import { LegatoEntity } from '../../entity/index'
import { LegatoField } from '../field.decorator'
import { LegatoIndex } from '../index.decorator'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../relation.decorator'

// ------ FIELD DECORATOR -------

export class FieldDecoratorTest extends LegatoEntity {
	@LegatoField()
	field: string = ''
}

// ------- INDEX DECORATOR ------

export class IndexDecoratorTest extends LegatoEntity {
	@LegatoIndex({
		unique: true,
	})
	unique: string = new ObjectID().toHexString()

	@LegatoIndex({
		unique: false,
	})
	notUnique: string = 'value'
}

export class IndexDecoratorUniqueTest extends LegatoEntity {
	@LegatoIndex({
		unique: true,
	})
	unique: string = ''
}

// -------- RELATION DECORATOR ----------

export class RelationDecoratorChildTest extends LegatoEntity {
	@LegatoField()
	field: string = 'john doe'
}

export class RelationDecoratorParentTest extends LegatoEntity {
	// _id by default and checkRelation = false
	@LegatoRelation({
		populatedKey: 'defaultAndNotCheckRelation',
		targetType: RelationDecoratorChildTest,
		checkRelation: false,
	})
	defaultAndNotCheckRelationId: ObjectID | null = null

	// _id by default and checkRelation = true (default)
	@LegatoRelation({
		populatedKey: 'defaultAndCheckRelation',
		targetType: RelationDecoratorChildTest,
	})
	defaultAndCheckRelationId: Object | null = null

	// Not use _id but id in child
	@LegatoRelation({
		populatedKey: 'notUseMongoIdId',
		targetType: RelationDecoratorChildTest,
		targetKey: 'id',
	})
	notUseMongoIdId: ObjectID | null = null
}
