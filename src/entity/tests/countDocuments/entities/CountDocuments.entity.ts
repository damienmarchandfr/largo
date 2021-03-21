import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class CountDocumentsTest extends LegatoEntity {
	@LegatoField()
	name = 'Legato'
}

export class CountDocumentsTestWithoutDecorator extends LegatoEntity {
	name = 'Legato'
}
