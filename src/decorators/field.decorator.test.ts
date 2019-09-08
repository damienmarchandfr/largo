import { MongORMField } from './field.decorator'
import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'

describe('MongORMField decorator', () => {
	it('should add field meta to mongORMetaDataStorage', () => {
		class MongORMFieldClass {
			@MongORMField()
			hello: string

			constructor() {
				this.hello = 'world'
			}
		}

		const classMeta = mongORMetaDataStorage().mongORMFieldMetas[
			generateCollectionName(new MongORMFieldClass())
		]
		expect(classMeta.length).toEqual(1)
		expect(classMeta[0]).toEqual('hello')
	})
})
