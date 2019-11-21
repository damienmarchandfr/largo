import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'
import { LegatoIndex } from '../../../../decorators/index.decorator'

export class DeleteManyChildTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteManyChild'

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
