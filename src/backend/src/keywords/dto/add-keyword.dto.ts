import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class AddKeywordDto {
  @IsString()
  @IsNotEmpty({ message: 'Keyword must not be empty' })
  @Length(1, 100, { message: 'Keyword must be between 1 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-]+$/, { message: 'Keyword may only contain letters, numbers, spaces, and hyphens' })
  term: string;
}
