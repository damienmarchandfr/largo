import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class UpdateTest extends LegatoEntity {
	noDecorator?: string

	@LegatoField()
	name = 'john'
}
