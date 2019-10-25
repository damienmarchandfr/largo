import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class NoChildEntityTest extends LegatoEntity {
	@LegatoField()
	prop: string = 'John Doe'
}
