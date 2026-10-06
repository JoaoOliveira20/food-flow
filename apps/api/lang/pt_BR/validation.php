<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines (pt_BR)
    |--------------------------------------------------------------------------
    |
    | Messages for the rules used by the API. Missing keys fall back to English
    | (APP_FALLBACK_LOCALE).
    |
    */

    'array' => 'O campo :attribute deve ser uma lista.',
    'between' => [
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'string' => 'O campo :attribute deve ter entre :min e :max caracteres.',
    ],
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'decimal' => 'O campo :attribute tem casas decimais demais.',
    'dimensions' => 'A :attribute tem dimensões inválidas.',
    'distinct' => 'O campo :attribute tem um valor repetido.',
    'exists' => 'O :attribute selecionado não existe.',
    'extensions' => 'A :attribute deve ter uma destas extensões: :values.',
    'file' => 'O campo :attribute deve ser um arquivo.',
    'image' => 'A :attribute deve ser uma imagem.',
    'in' => 'O valor de :attribute não é permitido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'list' => 'O campo :attribute deve ser uma lista.',
    'max' => [
        'array' => 'O campo :attribute deve ter no máximo :max itens.',
        'file' => 'A :attribute deve ter no máximo :max kilobytes.',
        'numeric' => 'O campo :attribute deve ser no máximo :max.',
        'string' => 'O campo :attribute deve ter no máximo :max caracteres.',
    ],
    'mimes' => 'A :attribute deve ser um arquivo do tipo: :values.',
    'mimetypes' => 'A :attribute deve ser um arquivo do tipo: :values.',
    'min' => [
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
        'file' => 'A :attribute deve ter pelo menos :min kilobytes.',
        'numeric' => 'O campo :attribute deve ser no mínimo :min.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'numeric' => 'O campo :attribute deve ser um número.',
    'present' => 'O campo :attribute deve ser enviado.',
    'prohibited' => 'O campo :attribute não pode ser enviado.',
    'regex' => 'O formato de :attribute é inválido.',
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute deve ser um texto.',
    'unique' => 'Já existe um registro com este :attribute.',
    'uploaded' => 'Não foi possível receber a :attribute. Verifique se o arquivo tem até 2 MB.',

    'custom' => [],

    'attributes' => [
        'name' => 'nome',
        'slug' => 'identificador',
        'image' => 'imagem',
        'displayWidth' => 'largura de exibição',
        'restingSurfaceRatio' => 'superfície de apoio',
        'sinkRatio' => 'afundamento',
        'isVisible' => 'visível',
        'sortOrder' => 'ordem',
        'bunVariantId' => 'tipo de pão',
        'ingredientIds' => 'ingredientes',
        'ingredientIds.*' => 'ingrediente',
    ],

];
