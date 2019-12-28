import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'
import { LegatoIndex } from '../../../../decorators/index.decorator'

export class PopulateChildTest extends LegatoEntity {
	@LegatoField()
	field: string = 'child'

	// Custom ids
	@LegatoIndex({
		unique: false,
	})
	stringId: string = ''

	@LegatoIndex({
		unique: false,
	})
	numberId: number = 0
}
