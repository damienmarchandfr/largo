import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'
import { LegatoIndex } from '../../../../decorators/index.decorator'

export class DeleteChildTest extends LegatoEntity {
	@LegatoField()
	name: string = 'john'

	// Custom ids
	@LegatoIndex({
		unique: false,
	})
	stringId: string | null = null

	@LegatoIndex({
		unique: false,
	})
	numberId: number | null = null
}
