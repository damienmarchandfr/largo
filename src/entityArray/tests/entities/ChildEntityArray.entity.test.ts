import { LegatoEntity } from '../../../entity'
import { LegatoField } from '../../../decorators/field.decorator'
import { LegatoIndex } from '../../../decorators/index.decorator'

export class ChildEntityArrayTest extends LegatoEntity {
	@LegatoField()
	field: string = 'john doe'

	// Custom ids
	@LegatoIndex({
		unique: false,
	})
	stringId?: string = ''

	@LegatoIndex({
		unique: false,
	})
	numberId: number = 0
}
