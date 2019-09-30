import { MongODMField } from './field.decorator'
import { mongODMetaDataStorage } from '..'
import { MongODMEntity } from '../entity/entity'

describe('MongODMField decorator', () => {
	it('should add field meta to mongODMetaDataStorage', () => {
		class MongODMFieldClass extends MongODMEntity {
			@MongODMField()
			hello: string

			constructor() {
				super()
				this.hello = 'world'
			}
		}

		const classMeta = mongODMetaDataStorage().mongODMFieldMetas
			.mongodmfieldclass

		expect(classMeta.length).toEqual(1)
		expect(classMeta[0]).toEqual('hello')
	})
})
