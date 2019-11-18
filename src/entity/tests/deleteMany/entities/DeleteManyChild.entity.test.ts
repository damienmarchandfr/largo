import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteManyChildTest extends LegatoEntity {
	@LegatoField()
	name = 'DeleteManyChild'
}
