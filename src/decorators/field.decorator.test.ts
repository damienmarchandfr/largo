import { LegatoField } from './field.decorator'
import { LegatoMetaDataStorage } from '..'
import { LegatoEntity } from '../entity'

describe('LegatoField decorator', () => {
	it('should add field meta to LegatoMetaDataStorage', () => {
		class LegatoFieldClass extends LegatoEntity {
			@LegatoField()
			hello: string

			constructor() {
				super()
				this.hello = 'world'
			}
		}

		const classMeta = LegatoMetaDataStorage().LegatoFieldMetas.legatofieldclass

		expect(classMeta.length).toEqual(1)
		expect(classMeta[0]).toEqual('hello')
	})
})
