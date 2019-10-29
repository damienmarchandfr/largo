import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteNoChildTest extends LegatoEntity {
	@LegatoField()
	name: string = 'DeleteNoChild'
}
