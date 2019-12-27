import { LegatoEntity } from '../../entity'
import { LegatoField } from '../../decorators/field.decorator'
import { LegatoIndex } from '../../decorators/index.decorator'
import { LegatoRelation } from '../../decorators/relation.decorator'
import { ObjectID } from 'mongodb'

export class AllDecoratorsTest extends LegatoEntity {
	@LegatoIndex({
		unique: false,
	})
	index: string = 'john'

	@LegatoField()
	field: string = 'john'

	@LegatoRelation({
		populatedKey: 'populated',
		targetType: AllDecoratorsTest,
	})
	relation: string = 'john'

	noDecorator: number = 1
}

export class NoDecoratorTest extends LegatoEntity {
	noDecorator: string = 'john doe'
}
