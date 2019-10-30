import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteChildTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteChild'
}
