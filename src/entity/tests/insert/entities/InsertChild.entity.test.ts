import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class InserChildTest extends LegatoEntity {
	@LegatoField()
	name = 'john'
}
