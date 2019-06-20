{
  'targets': [
    {
      'target_name': 'fdblib',
      'sources': [
        'src/module.cpp',
        'src/database.cpp',
        'src/transaction.cpp',
        'src/cluster.cpp',
        'src/error.cpp',
        'src/options.cpp',
        'src/future.cpp',
        'src/utils.cpp'
      ],
      'include_dirs': [
        "<!(node -e \"require('nan')\")"
      ],
      'cflags': ['-std=c++0x'],
      'conditions': [
        ['OS=="linux"', {
          'link_settings': { 'libraries': ['-lfdb_c'] },
        }],
        ['OS=="mac"', {
          # 'xcode_settings': { 'OTHER_CFLAGS': ['-std=c++0x', '-fsanitize=address'] },
          'xcode_settings': { 'OTHER_CFLAGS': ['-std=c++0x'] },
          'include_dirs': ['/usr/local/include'],
          # 'link_settings': { 'libraries': ['-lfdb_c', '-L/usr/local/lib', '-fsanitize=address'] },
          'link_settings': { 'libraries': ['-lfdb_c', '-L/usr/local/lib'] },
        }],
        ['OS=="win"', {
          'link_settings': { 'libraries': ['<!(echo %FOUNDATIONDB_INSTALL_PATH%)\\lib\\foundationdb\\fdb_c.lib'] },
          'include_dirs': ['<!(echo %FOUNDATIONDB_INSTALL_PATH%)\\include'],
        }],
        ['OS=="freebsd"', {
          'include_dirs': ['/usr/local/include'],
          'link_settings': { 'libraries': ['-lfdb_c', '-L/usr/local/lib'] },
        }],
      ],
    }
  ]
}
