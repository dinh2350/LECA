import { ApiProperty } from '@nestjs/swagger';

export class WordPairDto {
  @ApiProperty({ description: 'The target word the learner should pronounce' })
  targetWord: string;

  @ApiProperty({ description: 'The foil/contrast word for discrimination' })
  foilWord: string;

  @ApiProperty({ description: 'IPA transcription of the target word' })
  targetIpa: string;

  @ApiProperty({ description: 'IPA transcription of the foil word' })
  foilIpa: string;
}

export const PHONEME_WORD_PAIRS: Record<string, WordPairDto[]> = {
  '/z/': [
    {
      targetWord: 'zero',
      foilWord: 'sero',
      targetIpa: '/ˈziː.roʊ/',
      foilIpa: '/ˈsiː.roʊ/',
    },
    {
      targetWord: 'buzz',
      foilWord: 'bus',
      targetIpa: '/bʌz/',
      foilIpa: '/bʌs/',
    },
    {
      targetWord: 'zone',
      foilWord: 'sone',
      targetIpa: '/zoʊn/',
      foilIpa: '/soʊn/',
    },
    {
      targetWord: 'zip',
      foilWord: 'sip',
      targetIpa: '/zɪp/',
      foilIpa: '/sɪp/',
    },
  ],
  '/θ/': [
    {
      targetWord: 'think',
      foilWord: 'sink',
      targetIpa: '/θɪŋk/',
      foilIpa: '/sɪŋk/',
    },
    {
      targetWord: 'three',
      foilWord: 'free',
      targetIpa: '/θriː/',
      foilIpa: '/friː/',
    },
    {
      targetWord: 'mouth',
      foilWord: 'mouse',
      targetIpa: '/maʊθ/',
      foilIpa: '/maʊs/',
    },
    {
      targetWord: 'thick',
      foilWord: 'sick',
      targetIpa: '/θɪk/',
      foilIpa: '/sɪk/',
    },
  ],
  '/ð/': [
    {
      targetWord: 'this',
      foilWord: 'dis',
      targetIpa: '/ðɪs/',
      foilIpa: '/dɪs/',
    },
    {
      targetWord: 'that',
      foilWord: 'dat',
      targetIpa: '/ðæt/',
      foilIpa: '/dæt/',
    },
    {
      targetWord: 'breathe',
      foilWord: 'breed',
      targetIpa: '/briːð/',
      foilIpa: '/briːd/',
    },
    {
      targetWord: 'they',
      foilWord: 'day',
      targetIpa: '/ðeɪ/',
      foilIpa: '/deɪ/',
    },
  ],
  '/v/': [
    {
      targetWord: 'vest',
      foilWord: 'best',
      targetIpa: '/vɛst/',
      foilIpa: '/bɛst/',
    },
    {
      targetWord: 'vine',
      foilWord: 'wine',
      targetIpa: '/vaɪn/',
      foilIpa: '/waɪn/',
    },
    {
      targetWord: 'very',
      foilWord: 'berry',
      targetIpa: '/ˈvɛr.i/',
      foilIpa: '/ˈbɛr.i/',
    },
    {
      targetWord: 'veil',
      foilWord: 'bail',
      targetIpa: '/veɪl/',
      foilIpa: '/beɪl/',
    },
  ],
};
