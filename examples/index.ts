import { LegatoConnection } from '../src/connection'
import { ObjectID } from 'mongodb'
import { User } from './entities/User.entity'
import { Job } from './entities/Job.entity'

// Connect to Mongo
const databaseName = 'Legatoexample'

new LegatoConnection({
	databaseName,
})
	.connect({
		clean: true,
	})
	.then(async () => {
		// Connected to Mongo database
		console.log('Your are now connected')

		// Create first user
		const user1 = new User()
		const user2 = new User()
		const user3 = new User()

		user1.beforeInsert().subscribe(() => {
			console.log('Event before insert user 1')
		})

		user1.afterInsert().subscribe(() => {
			console.log('Event after insert user 1.')
		})

		console.log('Users will be inserted')

		await user1.insert()
		await user2.insert()
		await user3.insert()

		console.log('Users inserted')

		console.log('User 1 has 2 friends')
		user1.addFriend(user2._id as ObjectID)
		user2.addFriend(user3._id as ObjectID)

		await user1.update()

		console.log('Friends are added.')

		console.log('User 2 has 1 friend')
		user2.addFriend(user3._id as ObjectID)
		await user2.update()

		// User 1 and 2 have a job
		const job1 = new Job()
		await job1.insert()
		user1.setJob(job1._id as ObjectID)
		await user1.update()

		const job2 = new Job()
		await job2.insert()
		user2.setJob(job2._id as ObjectID)
		await user2.update()

		console.log('Get all users')
		const users = await User.find<User>()

		const populated = await users.populate()

		console.log(populated)

		console.log('Script executed :)')
	})
	.catch((err) => {
		console.error(err)
	})
