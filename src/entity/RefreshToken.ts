import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { User } from './User'

@Entity({ name: 'refreshTokens' })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    expiresIn: Date

    @ManyToOne(() => User)
    user: User

    @UpdateDateColumn()
    createdAt: number

    @UpdateDateColumn()
    updatedAt: number
}
