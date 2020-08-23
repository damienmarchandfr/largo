import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class FindEntityTest extends LegatoEntity {
	@LegatoField()
	name = 'Legato'

	@LegatoField()
	defaultValue = 'value'
}

export class FindEntityTestWithoutDecorator extends LegatoEntity {
	name: string = 'Legato'
}
